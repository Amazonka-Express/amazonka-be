import express from "express";
import grpc from "@grpc/grpc-js";
import { truck } from "./pb/truck";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3030;

app.use(cors());

app.get("/truck", async (req, res) => {
  try {
    console.log(process.env.TRUCK_URL || "localhost:50051");
    const client = new truck.TruckRouterClient(
      process.env.TRUCK_URL || "localhost:50051",
      grpc.credentials.createInsecure()
    );
    console.log("gRPC client created");

    const coordinates = [];
    const params = req.query;
    const routePoints: { lat?: number; lng?: number }[] = [];

    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith("route[") && key.includes("][lat]")) {
        const indexMatch = key.match(/route\[(\d+)\]/);
        if (indexMatch && indexMatch[1]) {
          const index = parseInt(indexMatch[1]);
          if (!routePoints[index]) {
            routePoints[index] = {};
          }
          routePoints[index].lat = parseFloat(value as string);
        }
      } else if (key.startsWith("route[") && key.includes("][lng]")) {
        const indexMatch = key.match(/route\[(\d+)\]/);
        if (indexMatch && indexMatch[1]) {
          const index = parseInt(indexMatch[1]);
          if (!routePoints[index]) {
            routePoints[index] = {};
          }
          routePoints[index].lng = parseFloat(value as string);
        }
      }
    }

    for (const point of routePoints) {
      if (point && point.lat !== undefined && point.lng !== undefined) {
        coordinates.push(
          new truck.Coordinates({
            latitude: point.lat,
            longitude: point.lng,
          })
        );
      }
    }

    const grpcReq = new truck.RouteRequest({
      coordinates,
    });

    const response = await new Promise((resolve, reject) => {
      client.GetRoute(grpcReq, (err, result) => {
        if (err || !result) {
          reject(err);
          return;
        }
        resolve(result);
      });
    })
      .then((result: any) => {
        const formattedCoordinates = result.coordinates?.map((node: any) => {
          const plainNode = {
            lat: node.coordinates?.latitude || 0,
            lng: node.coordinates?.longitude || 0,
          };

          if (node.has_stop_index) {
            return { ...plainNode, stop_index: node.stop_index };
          }

          return plainNode;
        });
        return { coordinates: formattedCoordinates };
      })
      .catch((err) => {
        console.error("Error in gRPC call:", err);
        return { error: "Error occurred during gRPC call" };
      });

    res.json(response);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
