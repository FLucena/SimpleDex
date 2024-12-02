import { ChakraProvider, Container } from "@chakra-ui/react";
import dynamic from 'next/dynamic';
import Head from 'next/head';

const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const SwapInterface = dynamic(() => import('../components/SwapInterface'), { ssr: false });

const Home = () => {
  return (
    <>
      <Head>
        <title>SimpleDEX - Decentralized Token Exchange</title>
        <meta name="description" content="A simple and efficient decentralized exchange for swapping tokens" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="SimpleDEX - Decentralized Token Exchange" />
        <meta property="og:description" content="A simple and efficient decentralized exchange for swapping tokens" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://simpledex.example.com" />
        <meta property="og:image" content="/og-image.png" />
        
        {/* PWA primary color */}
        <meta name="theme-color" content="#3182CE" />
      </Head>

      <ChakraProvider>
        <Container 
          maxW="container.xl" 
          p={0} 
          minH="100vh"
          bgGradient="linear(to-b, blue.50, white)"
        >
          <Navbar />
          <SwapInterface />
        </Container>
      </ChakraProvider>
    </>
  );
};

export default Home; 