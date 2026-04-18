import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  // Guard: service-role client must not be imported from client components
  // or dashboard pages. Allowed only under api/, lib/notifications/, and server actions.
  {
    files: ["src/app/(app)/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/service",
              message:
                "Service-role client bypasses RLS. Only import from src/app/api/** or src/lib/notifications/**.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
