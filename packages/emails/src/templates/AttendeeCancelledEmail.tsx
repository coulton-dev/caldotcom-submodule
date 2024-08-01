import { CallToAction } from "../components";
import { AttendeeScheduledEmail } from "./AttendeeScheduledEmail";

export const AttendeeCancelledEmail = (props: React.ComponentProps<typeof AttendeeScheduledEmail>) => {
  const propertyReference = props.calEvent.userFieldsResponses?.propertyReference.value;
  const rescheduleLink = `https://viewings.soresales.co.uk/${props.calEvent.organizer.username}/so-sales-viewing?propertyReference=${propertyReference}`;
  return (
    <>
      <AttendeeScheduledEmail
        title="event_request_cancelled"
        headerType="xCircle"
        subject="event_cancelled_subject"
        callToAction={
          <CallToAction label="Click here to book another viewing" href={rescheduleLink} secondary />
        }
        {...props}
      />
    </>
  );
};
