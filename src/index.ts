import colors from "colors";
import server, { connectDB } from "./server";

const port = process.env.PORT || 4000;

async function startServer() {
  await connectDB();
  server.listen(port, () => {
    console.log(colors.cyan.bold(`REST API en el puerto ${port}`));
  });
}

startServer();
