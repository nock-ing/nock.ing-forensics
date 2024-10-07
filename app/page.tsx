import BitcoinInfo from "@/app/bitcoin-info";

export default function Home() {
  return (
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Bitcoin RPC Example</h1>
        {/* eslint-disable-next-line react/jsx-no-undef */}
        <BitcoinInfo/>
      </main>
  );
}
