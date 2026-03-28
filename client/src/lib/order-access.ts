const ORDER_ACCESS_PREFIX = "order-access:";

export function getOrderAccessStorageKey(orderId: number) {
  return `${ORDER_ACCESS_PREFIX}${orderId}`;
}

export function setOrderAccessToken(orderId: number, token: string) {
  sessionStorage.setItem(getOrderAccessStorageKey(orderId), token);
}

export function getOrderAccessToken(orderId: number) {
  return sessionStorage.getItem(getOrderAccessStorageKey(orderId));
}

export function getOrderAccessHeaders(orderId: number) {
  const token = getOrderAccessToken(orderId);
  const headers: Record<string, string> = {};
  if (token) {
    headers["X-Order-Access-Token"] = token;
  }
  return headers;
}
