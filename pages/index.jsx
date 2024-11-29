import { ChakraProvider } from "@chakra-ui/react";
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues with window.ethereum
const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });
const SwapInterface = dynamic(() => import('../components/SwapInterface'), { ssr: false });

const Home = () => {
  return (
    <ChakraProvider>
      <Navbar />
      <SwapInterface />
    </ChakraProvider>
  );
};

export default Home; 