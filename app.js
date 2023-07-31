const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
let db = null;
const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR:${e.message}`);
    process.exit(1);
  }
};
initializeServer();

const convertDbObjectToArrayObjectStateTable = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToArrayObjectDistrictTable = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
SELECT * FROM state
`;
  const getAllStatesArray = await db.all(getAllStatesQuery);
  response.send(
    getAllStatesArray.map((i) => convertDbObjectToArrayObjectStateTable(i))
  );
});

//Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
SELECT * FROM state WHERE state_id=${stateId}`;
  const getStateArray = await db.get(getStateQuery);
  response.send(convertDbObjectToArrayObjectStateTable(getStateArray));
});

//Create a district in the district table,

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
    INSERT INTO district 
    (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths})
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
    * 
    FROM 
    district 
    WHERE 
    district_id=${districtId}
    `;
  const getDistrictArray = await db.get(getDistrictQuery);
  response.send(convertDbObjectToArrayObjectDistrictTable(getDistrictArray));
});

//Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id=${districtId}
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE
    district
    SET 
   district_name='${districtName}',
   state_id=${stateId},
   cases=${cases},
   cured=${cured},
   active=${active},
   deaths=${deaths}
   WHERE district_id=${districtId}
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getSumQuery = `
    SELECT 
    SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
    FROM district
    WHERE
    state_id=${stateId}
    `;
  const getSumArray = await db.get(getSumQuery);
  response.send(getSumArray);
});

//Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  //Query1
  const getDistrictQuery = `
    SELECT state_id 
    FROM district
    WHERE district_id=${districtId}
    `;
  const getDistrictArray = await db.get(getDistrictQuery);

  //Query2
  const getStateQuery = `
    SELECT state_name as stateName
    FROM state
    WHERE state_id=${getDistrictArray.state_id}
    `;
  const getStateArray = await db.get(getStateQuery);

  response.send(getStateArray);
});
module.exports = app;
