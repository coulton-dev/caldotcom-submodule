import { CalendarEvent } from "@lib/calendarClient";
import EventManager from "@lib/events/EventManager";
import prisma from "@lib/prisma";
import stripe from "@ee/lib/stripe/server";
import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handlePaymentSuccess(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const payment = await prisma.payment.update({
    where: {
      externalId: paymentIntent.id,
    },
    data: {
      success: true,
      booking: {
        update: {
          paid: true,
        },
      },
    },
    select: {
      bookingId: true,
      booking: {
        select: {
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          confirmed: true,
          attendees: true,
          location: true,
          userId: true,
          id: true,
          uid: true,
          paid: true,
          user: {
            select: {
              id: true,
              credentials: true,
              timeZone: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!payment) throw { message: "No payment found" };

  const { booking } = payment;

  if (!booking) throw { message: "No booking found" };

  const { user } = booking;

  if (!user) throw { message: "No user found" };

  const evt: CalendarEvent = {
    type: booking.title,
    title: booking.title,
    description: booking.description || undefined,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    organizer: { email: user.email!, name: user.name!, timeZone: user.timeZone },
    attendees: booking.attendees,
  };
  if (booking.location) evt.location = booking.location;

  if (booking.confirmed) {
    const eventManager = new EventManager(user.credentials);
    const scheduleResult = await eventManager.create(evt, booking.uid);

    await prisma.booking.update({
      where: {
        id: payment.bookingId,
      },
      data: {
        references: {
          create: scheduleResult.referencesToCreate,
        },
      },
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestBuffer = await buffer(req);
  const sig = req.headers["stripe-signature"];
  let event;

  if (!sig) {
    res.status(400).send(`Webhook Error: missing Stripe signature`);
    return;
  }

  if (!webhookSecret) {
    res.status(400).send(`Webhook Error: missing Stripe webhookSecret`);
    return;
  }

  try {
    event = stripe.webhooks.constructEvent(requestBuffer.toString(), sig, webhookSecret);

    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      await handlePaymentSuccess(event);
    } else {
      console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
}
