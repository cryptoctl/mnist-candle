import {Inter} from "next/font/google";
import dynamic from 'next/dynamic';
const Inference = dynamic(
    () => import('../components/Inference'),
    { ssr: false }
  )
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
      <main
          className={`flex p-24 ${inter.className}`}
      >
        <Inference />
      </main>
  );
}
