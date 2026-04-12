function generateKey() {
  const part = () => Math.random().toString(36).substring(2, 7).toUpperCase();
  return `XYA-${part()}-${part()}`;
}

console.log("Generated Key:", generateKey());
