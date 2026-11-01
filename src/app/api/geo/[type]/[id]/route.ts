export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      type: string;
      id: string;
    }>;
  },
) {
  const { type, id } = await params;

  const res = await fetch(`https://bdapis.vercel.app/geo/v2.0/${type}/${id}`);

  const data = await res.json();

  return Response.json(data);
}
