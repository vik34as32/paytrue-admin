import type { NextConfig } from "next";

function sanitizeChunkName(name: string) {
  return name.replace(/[()[\]@]/g, "");
}

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Prevent broken pages when .next cache is cleared while the dev server is running
      config.cache = { type: "memory" };
    }

    // IIS and some reverse proxies return 500 for `_next` URLs that contain
    // Next.js route-group parentheses or dynamic-segment brackets.
    if (!dev && !isServer) {
      config.plugins = config.plugins ?? [];
      config.plugins.push({
        apply(compiler: {
          hooks: {
            compilation: { tap: (name: string, fn: (compilation: unknown) => void) => void };
          };
        }) {
          compiler.hooks.compilation.tap(
            "SanitizeNextChunkNames",
            (compilation) => {
              const hooks = compilation as {
                hooks: {
                  beforeChunkIds: {
                    tap: (
                      name: string,
                      fn: (chunks: Iterable<{ name?: string }>) => void
                    ) => void;
                  };
                };
              };
              hooks.hooks.beforeChunkIds.tap(
                "SanitizeNextChunkNames",
                (chunks) => {
                  for (const chunk of chunks) {
                    if (chunk.name) {
                      chunk.name = sanitizeChunkName(chunk.name);
                    }
                  }
                }
              );
            }
          );
        },
      });

      if (config.output) {
        config.output.filename = (pathData: {
          chunk?: { name?: string; id?: string | number };
        }) => {
          const raw = String(pathData.chunk?.name || pathData.chunk?.id || "chunk");
          return `static/chunks/${sanitizeChunkName(raw)}-[contenthash].js`;
        };
        config.output.chunkFilename = (pathData: {
          chunk?: { name?: string; id?: string | number };
        }) => {
          const raw = String(pathData.chunk?.name || pathData.chunk?.id || "chunk");
          return `static/chunks/${sanitizeChunkName(raw)}-[contenthash].js`;
        };
      }
    }

    return config;
  },
};

export default nextConfig;
