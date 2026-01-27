import ClaimClient from "./ClaimClient";

export default function ClaimPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = String(searchParams?.token ?? "").trim();
  return <ClaimClient token={token} />;
}
