/* eslint-disable @next/next/no-head-element */
import BaseTable from "./BaseTable";
import EmailBodyLogo from "./EmailBodyLogo";
import EmailHead from "./EmailHead";
import EmailScheduledBodyHeaderContent from "./EmailScheduledBodyHeaderContent";
import EmailSchedulingBodyDivider from "./EmailSchedulingBodyDivider";
import EmailSchedulingBodyHeader from "./EmailSchedulingBodyHeader";
import RawHtml from "./RawHtml";
import Row from "./Row";

const Html = (props: { children: React.ReactNode }) => (
  <>
    <RawHtml html={`<!doctype html>`} />
    <html>{props.children}</html>
  </>
);

function GetManageLink(props: { attendee: any; calEvent: any }) {
  if (!props.calEvent.paymentInfo) return null;

  const manageText = props.attendee.language?.translate("pay_now") || "";

  return (
    <RawHtml
      html={`
<tr>
  <td align="center" bgcolor="#292929" role="presentation" style="border:none;border-radius:3px;cursor:auto;mso-padding-alt:10px 25px;background:#292929;" valign="middle">
    <p style="display:inline-block;background:#292929;color:#ffffff;font-family:Roboto, Helvetica, sans-serif;font-size:16px;font-weight:500;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:3px;">
      <a style="color: #FFFFFF; text-decoration: none;" href="" target="_blank">${manageText} <img src="" width="12px"></img></a>
    </p>
  </td>
</tr>
    `}
    />
  );
}

export const BaseEmailHtml = (props: { children: React.ReactNode }) => {
  return (
    <Html>
      <EmailHead title="Title" />
      <body style={{ wordSpacing: "normal", backgroundColor: "#F5F5F5" }}>
        <div style={{ backgroundColor: "#F5F5F5" }}>
          <EmailSchedulingBodyHeader headerType="calendarCircle" />
          <EmailScheduledBodyHeaderContent
            title="meeting_awaiting_payment"
            subtitle="emailed_you_and_any_other_attendees"
          />
          <EmailSchedulingBodyDivider />
          <RawHtml
            html={`<!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" className="" style="width:600px;" width="600" bgcolor="#FFFFFF" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->`}
          />
          <div
            style={{
              background: "#FFFFFF",
              backgroundColor: "#FFFFFF",
              margin: "0px auto",
              maxWidth: 600,
            }}>
            <Row
              align="center"
              border="0"
              style={{ background: "#FFFFFF", backgroundColor: "#FFFFFF", width: "100%" }}>
              <td
                style={{
                  borderLeft: "1px solid #E1E1E1",
                  borderRight: "1px solid #E1E1E1",
                  direction: "ltr",
                  fontSize: 0,
                  padding: 0,
                  textAlign: "center",
                }}>
                <RawHtml
                  html={`<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td className="" style="vertical-align:top;width:598px;" ><![endif]-->`}
                />
                <div
                  className="mj-column-per-100 mj-outlook-group-fix"
                  style={{
                    fontSize: 0,
                    textAlign: "left",
                    direction: "ltr",
                    display: "inline-block",
                    verticalAlign: "top",
                    width: "100%",
                  }}>
                  <Row border="0" style={{ verticalAlign: "top" }} width="100%">
                    <td align="left" style={{ fontSize: 0, padding: "10px 25px", wordBreak: "break-word" }}>
                      <div
                        style={{
                          fontFamily: "Roboto, Helvetica, sans-serif",
                          fontSize: 16,
                          fontWeight: 500,
                          lineHeight: 1,
                          textAlign: "left",
                          color: "#3E3E3E",
                        }}>
                        {props.children}
                      </div>
                    </td>
                  </Row>
                </div>
                <RawHtml html={`<!--[if mso | IE]></td></tr></table><![endif]-->`} />
              </td>
            </Row>
          </div>
          <EmailSchedulingBodyDivider />
          <RawHtml
            html={`<!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" className="" style="width:600px;" width="600" bgcolor="#FFFFFF" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->`}
          />
          <div
            style={{
              background: "#FFFFFF",
              backgroundColor: "#FFFFFF",
              margin: "0px auto",
              maxWidth: 600,
            }}>
            <Row
              align="center"
              border="0"
              style={{ background: "#FFFFFF", backgroundColor: "#FFFFFF", width: "100%" }}>
              <td
                style={{
                  borderBottom: "1px solid #E1E1E1",
                  borderLeft: "1px solid #E1E1E1",
                  borderRight: "1px solid #E1E1E1",
                  direction: "ltr",
                  fontSize: 0,
                  padding: 0,
                  textAlign: "center",
                }}>
                <RawHtml
                  html={`<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td className="" style="vertical-align:top;width:598px;" ><![endif]-->`}
                />
                <div
                  className="mj-column-per-100 mj-outlook-group-fix"
                  style={{
                    fontSize: 0,
                    textAlign: "left",
                    direction: "ltr",
                    display: "inline-block",
                    verticalAlign: "top",
                    width: "100%",
                  }}>
                  <BaseTable border="0" style={{ verticalAlign: "top" }} width="100%">
                    <tbody>
                      <tr>
                        <td
                          align="center"
                          vertical-align="middle"
                          style={{ fontSize: 0, padding: "10px 25px", wordBreak: "break-word" }}>
                          <BaseTable border="0" style={{ borderCollapse: "separate", lineHeight: "100%" }}>
                            <GetManageLink attendee={{}} calEvent={{}} />
                          </BaseTable>
                        </td>
                      </tr>
                      <tr>
                        <td
                          align="left"
                          style={{ fontSize: 0, padding: "10px 25px", wordBreak: "break-word" }}>
                          <div
                            style={{
                              fontFamily: "Roboto, Helvetica, sans-serif",
                              fontSize: 13,
                              lineHeight: 1,
                              textAlign: "left",
                              color: "#000000",
                            }}></div>
                        </td>
                      </tr>
                    </tbody>
                  </BaseTable>
                </div>
                <RawHtml html={`<!--[if mso | IE]></td></tr></table><![endif]-->`} />
              </td>
            </Row>
          </div>
          <EmailBodyLogo />
          <RawHtml html={`<!--[if mso | IE]></td></tr></table><![endif]-->`} />
        </div>
      </body>
    </Html>
  );
};

export const EmailHtml = () => {
  return (
    <BaseEmailHtml>
      <p>what</p>
      {/* 
      ${this.getWhat()}
      ${this.getWhen()}
      ${this.getWho()}
      ${this.getLocation()}
      ${this.getDescription()}
      ${this.getAdditionalNotes()}
      ${this.getCustomInputs()}
      */}
    </BaseEmailHtml>
  );
};
