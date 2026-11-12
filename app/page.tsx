import Nav from '@/components/Nav';
import PullCord from '@/components/PullCord';
import Hero from '@/components/Hero';
import Doors from '@/components/Doors';
import Story from '@/components/Story';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <PullCord />
      <Nav />
      <main>
        <Hero />
        <Doors />
        <Story />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
