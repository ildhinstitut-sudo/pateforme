declare const Netlify: { env: { get(name: string): string | undefined } }

export function env(name: string, required = true) {
  const value = Netlify.env.get(name)
  if (required && !value) throw new Error(`Variable d'environnement manquante: ${name}`)
  return value ?? ''
}
