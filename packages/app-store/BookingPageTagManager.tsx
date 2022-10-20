import Script from "next/script";

import { getEventTypeAppData } from "@calcom/app-store/utils";

// TODO: Maintain it from config.json to avoid hardcoding scripts and to add Google Analytics GA4 script
/*
<>
<script async src="https://www.googletagmanager.com/gtag/js?id="{TRACKING_ID}", />
<script>{`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '{TRACKING_ID}');
`}
</script>
</>
 */

const trackingApps: Record<string, Record<string, unknown>> = {
  fathom: {
    src: "https://cdn.usefathom.com/script.js",
    "data-site": "{TRACKING_ID}",
  },
};

export default function BookingPageTagManager({
  eventType,
}: {
  eventType: Parameters<typeof getEventTypeAppData>[0];
}) {
  return (
    <>
      {Object.entries(trackingApps).map(([appId, scriptConfig]) => {
        const trackingId = getEventTypeAppData(eventType, "fathom")?.trackingId;
        if (!trackingId) {
          return null;
        }
        const parsedScriptConfig: Record<string, unknown> = {};
        Object.entries(scriptConfig).forEach(([name, value]) => {
          if (typeof value === "string") {
            value = value.replace("{TRACKING_ID}", trackingId);
          }
          parsedScriptConfig[name] = value;
        });
        return <Script key={appId} {...parsedScriptConfig} defer />;
      })}
    </>
  );
}
