import { generatorHandler } from "@prisma/generator-helper";
import fs from "node:fs/promises";
import path from "node:path";

const header = `/**
 * This file was generated by a custom prisma generator, do not edit it manually.
 * This allows usage of the generated Prisma Enums to be used on the client side.
 * We re-export this file from the \`@calcom/trpc\` package, since it's more widely used
 * and doesn't force us to add the prisma package as a dependency in a bunch of places.
 **/\n
`;

generatorHandler({
  onManifest() {
    return {
      defaultOutput: "./enums/index.ts",
      prettyName: "Prisma Enum Generator",
    };
  },
  async onGenerate(options) {
    const enums = options.dmmf.datamodel.enums;

    const output = enums.map((e) => {
      let enumString = `export const ${e.name} = {\n`;
      e.values.forEach(({ name: value }) => {
        enumString += `  ${value}: "${value}",\n`;
      });
      enumString += `} as const;\n\n`;
      enumString += `export type ${e.name} = (typeof ${e.name})[keyof typeof ${e.name}];\n`;

      return enumString;
    });

    const outputFile = options.generator.output;
    if (!outputFile || !outputFile.value) {
      throw new Error("No output file specified");
    }

    const outputPath = path.resolve(outputFile.value);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, header + output.join("\n"), "utf-8");
  },
});
