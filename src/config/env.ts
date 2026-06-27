type EnvShape = {
  NEXT_PUBLIC_APP_NAME: string;
};

function readEnvString(
  key: keyof EnvShape,
  fallbackValue: string
): string {
  const value = process.env[key] ?? fallbackValue;

  if (value.trim().length === 0) {
    throw new Error(`Environment variable ${key} must not be empty.`);
  }

  return value;
}

export function getEnv(): EnvShape {
  return {
    NEXT_PUBLIC_APP_NAME: readEnvString("NEXT_PUBLIC_APP_NAME", "Linxo Money Pools")
  };
}
