import path from "path"
import { fileURLToPath } from "url"

/** Always use this app's directory (avoids wrong root from C:\\Users\\alexa\\package-lock.json). */
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)))

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: projectRoot,
    },
  },
}

export default config
