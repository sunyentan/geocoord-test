import React, { useState } from "react";
import "./App.css";

const App: React.FC = () => {
  const [modelId, setModelId] = useState("");
  const [result, setResult] = useState<any[]>([]);
  const [simpleFormat, setSimpleFormat] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const getSweepsQuery = `
    query getSweeps($modelId: ID!) {
      model(id: $modelId) {
        locations {
          id
          position { x y z }
          panos {
            skybox(resolution: "2k") {
              children
            }
          }
        }
      }
    }
  `;

  const getGeoQuery = `
    query getLatLongOfModelPoint($modelId: ID!, $point: IPoint3D!) {
      model(id: $modelId) {
        geocoordinates {
          geoLocationOf(modelLocation: $point) {
            lat
            long
          }
        }
      }
    }
  `;

  const handleFetch = async () => {
    setLoading(true);
    setResult([]);
    setSimpleFormat("");

    const basicAuth = btoa(
      `${process.env.REACT_APP_MATTERPORT_API_KEY}:${process.env.REACT_APP_MATTERPORT_API_SECRET}`
    );

    const sweepsRes = await fetch(process.env.REACT_APP_MATTERPORT_API_URL!, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: getSweepsQuery,
        variables: { modelId },
      }),
    });

    const sweepsData = await sweepsRes.json();
    const locations = sweepsData.data?.model?.locations || [];

    const fullData: any[] = [];
    const csvRows: string[] = [];

    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      const point = { x: loc.position.x, y: loc.position.y, z: loc.position.z };

      const geoRes = await fetch(process.env.REACT_APP_MATTERPORT_API_URL!, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: getGeoQuery,
          variables: { modelId, point },
        }),
      });

      const geoData = await geoRes.json();
      const geo = geoData.data?.model?.geocoordinates?.geoLocationOf;

      if (!geo || !loc.panos || loc.panos.length === 0) continue;

      loc.panos.forEach((pano: any, panoIndex: any) => {
        const skyboxImages = pano?.skybox?.children || [];

        if (skyboxImages.length !== 6) return;

        const entry = {
          id: `${loc.id}_pano${panoIndex + 1}`,
          latitude: geo.lat,
          longitude: geo.long,
          skyboxImages,
        };

        fullData.push(entry);

        csvRows.push(
          `${geo.lat},${geo.long},blue,marker,"GEO${i + 1}_PANO${
            panoIndex + 1
          }"`
        );
      });
    }

    setResult(fullData);
    setSimpleFormat(csvRows.join("\n"));
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Matterport Model Geo & Image Fetcher</h2>
      <p>
        Use this to plot
        https://mobisoftinfotech.com/tools/plot-multiple-points-on-map/
      </p>
      <input
        type="text"
        placeholder="Enter Model ID"
        value={modelId}
        onChange={(e) => setModelId(e.target.value)}
        style={{ width: "300px" }}
      />
      <button
        onClick={handleFetch}
        disabled={loading}
        style={{ marginLeft: "10px" }}
      >
        {loading ? "Loading..." : "Fetch Data"}
      </button>

      <h3>Result (JSON)</h3>
      <pre style={{ background: "#eee", padding: "10px" }}>
        {JSON.stringify(result, null, 2)}
      </pre>

      <h3>CSV Format</h3>
      <pre style={{ background: "#eee", padding: "10px" }}>{simpleFormat}</pre>
    </div>
  );
};

export default App;
