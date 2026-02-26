import { ConfigProvider, theme } from "antd";
import RouterSet from "./routes/RouterSet";

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          fontFamily: "Mona-Sans",
          //colorBgBase: "#141824",
          //colorTextBase: "#f1f5f9", // slate-100
        },
        components: {
          Modal: {
            colorBgElevated: "#141824",
          },
          Input: {
            colorBgContainer: "#141824",
            activeShadow: "0 0 0 0.2px rgba(5, 145, 255, 0.1)",
          },
          Select: {
            colorBgContainer: "#37393C",
          },
          Drawer: {
            colorBgElevated: "#12131f",
          },
          // DatePicker: {
          //   colorBgContainer: "#37393C",

          // },
        }
      }}
    >
      <div className="bg-[#0a0e1a] min-h-screen">
        <RouterSet />
      </div>
    </ConfigProvider>
  );
}

export default App;
