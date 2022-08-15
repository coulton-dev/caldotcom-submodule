import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => `https://developer.cal.com/eslint/rule/${name}`);
const rule = createRule({
  create(context) {
    return {
      CallExpression(node) {
        const webStorages = ["localStorage", "sessionStorage"];
        const callee = node.callee;
        if (
          // Can't figure out how to fix this TS issue
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          callee.object?.object?.name === "window" &&
          // Can't figure out how to fix this TS issue
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          webStorages.includes(node?.callee?.object?.property?.name)
        ) {
          return context.report({
            node: node,
            loc: node.loc,
            messageId: "possible-issue-with-embed",
          });
          return null;
        }

        // node.specifiers.length &&
        //   node.source.value === "dayjs" &&
        //   node.specifiers.forEach((item) => {
        //     if (item.local.name === "dayjs") {
        //       return context.report({
        //         node: item,
        //         loc: node.loc,
        //         messageId: "dayjs-moved",
        //         fix: (fixer) => fixer.replaceText(node, "import dayjs from '@calcom/dayjs'"),
        //       });
        //     }
        //     return null;
        //   });
      },
    };
  },
  name: "avoid-web-storage",
  meta: {
    fixable: "code",
    docs: {
      description: "Avoid deprecated imports",
      recommended: "warn",
    },
    messages: {
      "possible-issue-with-embed": `Be aware that accessing localStorage/sessionStorage throws error in Chrome Incognito mode when embed is in cross domain context. Disable this rule per line if you know what you are doing. See https://github.com/calcom/cal.com/issues/2618`,
    },
    type: "suggestion",
    schema: [],
  },
  defaultOptions: [],
});

export default rule;
