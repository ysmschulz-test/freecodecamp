import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ optionsSuccessStatus: 200 }));

app.use(express.static("public"));

app.get("/", (_req, res) => {
  res.sendFile(import.meta.dirname + "/views/index.html");
});

// Do not change code above this line


app.get("/api/:date", function (req, res) {
  const { date } = req.params;
  let inputDate;

  if (!date) {
    inputDate = new Date();
  } else {
    if (/^\d+$/.test(date)) {
      inputDate = new Date(parseInt(date));
    } else {
      inputDate = new Date(date);
    }
  }
  if (isNaN(inputDate.getTime())) {
    return res.json({ error: "Invalid Date" });
  }

  return res.json({
    unix: inputDate.getTime(),
    utc: inputDate.toUTCString()
  });
});

app.get("/api", function (req, res) {
  const inputDate = new Date();
  return res.json({
    unix: inputDate.getTime(),
    utc: inputDate.toUTCString()
  });
});

// Do not change code below this line

const PORT = 8000;
const listener = app.listen(PORT, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
