type EnvShape = {
  NEXT_PUBLIC_APP_NAME: string;
  LINXO_PAYMENTS_API_BASE_URL: string;
  LINXO_PAYMENTS_API_KEY: string;
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
    NEXT_PUBLIC_APP_NAME: readEnvString(
      "NEXT_PUBLIC_APP_NAME",
      "Linxo Money Pools"
    ),
    LINXO_PAYMENTS_API_BASE_URL: readEnvString(
      "LINXO_PAYMENTS_API_BASE_URL",
      "https://api-placeholder.linxo.example"
    ),
    LINXO_PAYMENTS_API_KEY: readEnvString(
      "LINXO_PAYMENTS_API_KEY",
      "replace-me"
    )
  };
}
