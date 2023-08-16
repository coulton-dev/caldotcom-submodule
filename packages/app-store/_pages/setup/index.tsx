import dynamic from "next/dynamic";

import { DynamicComponent } from "../../_components/DynamicComponent";

export const AppSetupMap = {
  "apple-calendar": dynamic(() => import("../../applecalendar/pages/setup")),
  bigbluebutton: dynamic(() => import("../../bigbluebutton/pages/setup")),
  exchange: dynamic(() => import("../../exchangecalendar/pages/setup")),
  "exchange2013-calendar": dynamic(() => import("../../exchange2013calendar/pages/setup")),
  "exchange2016-calendar": dynamic(() => import("../../exchange2016calendar/pages/setup")),
  "caldav-calendar": dynamic(() => import("../../caldavcalendar/pages/setup")),
  zapier: dynamic(() => import("../../zapier/pages/setup")),
  closecom: dynamic(() => import("../../closecom/pages/setup")),
  sendgrid: dynamic(() => import("../../sendgrid/pages/setup")),
  paypal: dynamic(() => import("../../paypal/pages/setup")),
};

export const AppSetupPage = (props: { slug: string }) => {
  return <DynamicComponent<typeof AppSetupMap> componentMap={AppSetupMap} {...props} />;
};

export default AppSetupPage;
