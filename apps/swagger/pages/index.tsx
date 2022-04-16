import Head from "next/head";
import SwaggerUI from "swagger-ui-react";

const requestSnippets = {
  generators: {
    curl_bash: {
      title: "cURL (bash)",
      syntax: "bash",
    },
    curl_powershell: {
      title: "cURL (PowerShell)",
      syntax: "powershell",
    },
    curl_cmd: {
      title: "cURL (CMD)",
      syntax: "bash",
    },
    node: {
      title: "Node",
      syntax: "node",
    },
  },
  defaultExpanded: true,
  languages: ["curl_bash"],
  // e.g. only show curl bash = ["curl_bash"]
};
export default function APIDocs() {
  return (
    <SwaggerUI
      requestSnippets={requestSnippets}
      requestSnippetsEnabled={true}
      docExpansion="none"
      operationsSorter="method"
      filter={true}
      withCredentials={true}
      persistAuthorization={true}
      url={process.env.NEXT_PUBLIC_SWAGGER_DOCS_URL || "https://api.cal.com/api/docs"}
      // preauthorizeApiKey=""
    />
  );
}
