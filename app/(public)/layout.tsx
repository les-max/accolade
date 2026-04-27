import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import RevealObserver from "@/components/RevealObserver";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RevealObserver />
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
