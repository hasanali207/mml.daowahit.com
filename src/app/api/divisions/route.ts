export async function GET() {
  const res = await fetch("https://bdapis.vercel.app/geo/v2.0/divisions");

  const data = await res.json();

  return Response.json(data);
}
