import ActivityPanel from "~/components/ActivityPanel";
import { DEFAULT_PARAMETER, PLTS_PARAMETERS } from "~/json/plts-parameter-json";
import { createPltsReadings } from "~/lib/plts-readings";

// Enam kartu parameter dan grafik "PLTS Activity" di bawah simulator halaman /plts.
// Datanya pembacaan live dari alat PLTS PV; bukan dari slider simulator.
export default function PltsParameters() {

  const { readings, history } = createPltsReadings();

  return (
    <ActivityPanel
      parameters={PLTS_PARAMETERS}
      defaultKey={DEFAULT_PARAMETER}
      readings={readings}
      history={history}
      title="PLTS Activity"
      ariaLabel="Parameter PLTS"
      selectId="plts-activity-metric"
      filePrefix="plts-activity"
    />
  );
}
