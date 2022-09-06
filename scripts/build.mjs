import { build } from "@ncpa0cpl/nodepack";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

build({
  target: "es2022",
  srcDir: path.resolve(__dirname, "../src"),
  outDir: path.resolve(__dirname, "../dist"),
  tsConfig: path.resolve(__dirname, "../tsconfig.json"),
  formats: ["cjs", "esm", "legacy"],
  declarations: true,
});
