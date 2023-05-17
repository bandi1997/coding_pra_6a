const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObject2 = (dbObject) => {
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

const convertDbObjectToResponseObject3 = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

//API1
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  let statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((eachItem) => convertDbObjectToResponseObject1(eachItem))
  );
});

//API2
app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let getStateQuery = `
    SELECT 
      * 
    FROM 
      state 
    WHERE 
      state_id = ${stateId};`;
  let state = await database.get(getStateQuery);
  response.send(convertDbObjectToResponseObject1(state));
});

//API3
app.post("/districts/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let postDistrictQuery = `
  INSERT INTO
     district (district_name, state_id, cases,cured,active,deaths)
  VALUES
    ('${districtName}', ${stateId}, '${cases}', '${cured}', '${active}', '${deaths}');`;
  let district = await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API4
app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let getDistrictQuery = `
    SELECT 
      * 
    FROM 
      district 
    WHERE 
      district_id = ${districtId};`;
  let district = await database.get(getDistrictQuery);
  response.send(convertDbObjectToResponseObject2(district));
});

//API5
app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API6
app.put("/districts/:districtId/", async (request, response) => {
  let { districtName, stateId, cases, cured, active, deaths } = request.body;
  let { districtId } = request.params;
  let updateDistrictQuery = `
  UPDATE
    district
  SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases}
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE
    district_id = ${districtId};`;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  let getStatesStatsQuery = `
    SELECT 
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM 
      district
    WHERE 
      state_id = ${stateId};`;
  let stats = await database.get(getStatesStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;
  let getDistrictIdQuery = `SELECT
      state_name
    FROM
      state
    NATURAL JOIN district
    WHERE
      district_id = ${districtId};`;
  let getStateNameQueryResponse = await database.get(getDistrictIdQuery);
  response.send(convertDbObjectToResponseObject3(getStateNameQueryResponse));
});

module.exports = app;
