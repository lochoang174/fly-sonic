// Import routes
import { WalletProvider } from "./hooks/use-wallet";
import RootRoutes from "./routes/RootRoutes";
import "./wallet-custom.css";
function App() {
  return (
    // add wallet provider
    <WalletProvider>
      <RootRoutes />
    </WalletProvider>
  );
}

export default App;
