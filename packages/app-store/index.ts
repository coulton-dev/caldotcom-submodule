const appStore = {
  // example: () => import("./example"),
  applecalendar: () => import("./applecalendar"),
  aroundvideo: () => import("./around"),
  bigbluebuttonvideo: () => import("./bigbluebutton"),
  caldavcalendar: () => import("./caldavcalendar"),
  closecom: () => import("./closecom"),
  dailyvideo: () => import("./dailyvideo"),
  googlecalendar: () => import("./googlecalendar"),
  googlevideo: () => import("./googlevideo"),
  hubspot: () => import("./hubspot"),
  huddle01video: () => import("./huddle01video"),
  jitsivideo: () => import("./jitsivideo"),
  larkcalendar: () => import("./larkcalendar"),
  office365calendar: () => import("./office365calendar"),
  office365video: () => import("./office365video"),
  plausible: () => import("./plausible"),
  paypal: () => import("./paypal"),
  salesforce: () => import("./salesforce"),
  zohocrm: () => import("./zohocrm"),
  sendgrid: () => import("./sendgrid"),
  stripepayment: () => import("./stripepayment"),
  tandemvideo: () => import("./tandemvideo"),
  vital: () => import("./vital"),
  zoomvideo: () => import("./zoomvideo"),
  wipemycalother: () => import("./wipemycalother"),
  webexvideo: () => import("./webex"),
  giphy: () => import("./giphy"),
  zapier: () => import("./zapier"),
  exchange2013calendar: () => import("./exchange2013calendar"),
  exchange2016calendar: () => import("./exchange2016calendar"),
  exchangecalendar: () => import("./exchangecalendar"),
  facetime: () => import("./facetime"),
  sylapsvideo: () => import("./sylapsvideo"),
  "zoho-bigin": () => import("./zoho-bigin"),
  telegramvideo: () => import("./telegram"),
};

export default appStore;
