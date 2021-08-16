import { useEffect } from "react";
import DailyIframe from '@daily-co/daily-js';
import { useRouter } from "next/router";
import prisma from "../../lib/prisma";
import { getSession } from 'next-auth/client';
import type {NextApiRequest, NextApiResponse} from 'next';


//lola-internal this page is where we'll join a daily call. Booking meeting owners will need to let users in to join.


export default function joinCall(props, session) {
   // Get router variables
   const router = useRouter();
   const { uid } = router.query;
   const owner = session.userid === props.booking.user.id
   

  const url = props.booking.dailyurl
  const token = props.booking.dailytoken
  useEffect(() => {
    if(!owner){
  const callFrame = DailyIframe.createFrame({
    showLeaveButton: true,
    iframeStyle: {
      position: 'fixed',
      width: '100%',
     height: '100%'
    }
  });
      callFrame.join({
        url: url,
        showLeaveButton: true,
        
    })}
    if(owner){
      const callFrame = DailyIframe.createFrame({
        showLeaveButton: true,
        iframeStyle: {
          position: 'fixed',
          width: '100%',
         height: '100%'
        }
      });
          callFrame.join({
            url: url,
            showLeaveButton: true,
            token: token,
            
        })}

}, [])

return joinCall;

}

/*lola internal oldworkingcode 

export default function joinCall(props, session) {
   // Get router variables
   const router = useRouter();
   const { uid } = router.query;
   
   

  const url = props.booking.dailyurl
  useEffect(() => {
  const callFrame = DailyIframe.createFrame({
    showLeaveButton: true,
    iframeStyle: {
      position: 'fixed',
      width: '100%',
     height: '100%'
    }
  });
      callFrame.join({
        url: url,
        showLeaveButton: true,
        
    })
}, [])

return joinCall;

}
*/



export async function getServerSideProps(context) {
  const booking = await prisma.booking.findFirst({
    where: {
      uid: context.query.uid,
    },
    select: {
      id: true,
      user: {
        select: {
          credentials: true,
        },
      },
      dailyurl: true,
      dailytoken: true,
      attendees: true,
      references: {
        select: {
          uid: true,
          type: true,
        },
      },
    },
  });
  
  return {
    props: {
      booking: booking
    },

  };
}

// lola internal this action finds the meeting owner token for the request 

export async function handler(req: NextApiRequest, res: NextApiResponse, props) {
  const session = await getSession({req: req});

  if (session) {
      return session;
  }}
