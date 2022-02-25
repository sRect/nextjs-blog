// https://stackblitz.com/github/vercel/next.js/tree/canary/examples/api-routes?file=pages%2Fperson%2F[id].js
export const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();

  if (res.status !== 200) {
    throw new Error(data.message);
  }
  return data;
};
