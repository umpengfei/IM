const BaseJoi = require("joi");
const Extension = require("joi-date-extensions");
const Joi = BaseJoi.extend(Extension);
const express = require("express");
const app = express();

app.use(express.json());

// the input hour is in the format of 08:13, meaning from 8:00 am
// to 13:00 pm
const time = /^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|1[0-9]|2[0-3])$/;
const doctors = [];

// app.put("/test", (req, res) => {
//   const schemaHour = Joi.object().pattern(
//     Joi.date().format("YYYY-MM-DD"),
//     Joi.string().regex(time)
//   );
//   const schemaDoctor = Joi.object({
//     name: Joi.string(),
//     workingHours: schemaHour
//   });
//   const result = Joi.validate(req.body, schemaDoctor);
//   if (result.error) {
//     res.status(404).send("input not valid");
//   } else {
//     res.send("passed");
//   }
// });

// track doctor workingHours
app.get("/:name", (req, res) => {
  const doctor = doctors.find(d => d.name === req.params.name);
  if (!doctor) res.status(404).send("Doctor not found");
  res.send(doctor.workingHours);
});

//track booked appointments
app.get("/appointments/:name", (req, res) => {
  const doctor = doctors.find(d => d.name === req.params.name);
  if (!doctor) res.status(404).send("Doctor not found");
  res.send(doctor.appointments);
});

// create a doctor working hours
app.post("/workingHours", (req, res) => {
  //validate the import doctor data
  if (!checkValidDoctor(req.body)) {
    res.status(404).send("Invalid data");
    return;
  }
  // update or create a doctor working hours
  const input = {
    name: req.body.name,
    workingHours: req.body.workingHours,
    appointments: []
  };
  // if there is not such doctor, add this doctors
  // if there is already this doctor, update his or her workingHours
  const doctor = doctors.find(d => d.name === input.name);
  if (!doctor) {
    doctors.push(input);
    res.send(input).send("Woking hour added");
  } else {
    doctor.workingHours = input.workingHours;
    res.send(input).send("Working hour updated");
  }
});

// book a doctor opening
app.post("/appointments", (req, res) => {
  if (!checkValidAppointments(req.body)) {
    res.status(404).send("Invalid input");
  }
  //create a new appointment
  const input = {
    patientName: req.body.patientName,
    doctorName: req.body.doctorName,
    appointDate: req.body.appointDate,
    appointTime: req.body.appointTime
  };
  //check whether overlap with an existing appointment
  const doctor = doctors.find(d => d.name === req.body.doctorName);
  const appointments = doctor.appointments;
  if (!isWork(input, doctor.workingHours)) {
    res.send("Doctor not working at this time");
    return;
  }
  if (!isOverLap(input, appointments)) {
    appointments.push(input);
    res.send(input);
  } else {
    res.send("Not an opening");
  }
});

// check the data input to create doctor is valid
function checkValidDoctor(input) {
  const schemaHour = Joi.object().pattern(
    Joi.date().format("YYYY-MM-DD"),
    Joi.string().regex(time)
  );
  const schemaDoctor = Joi.object({
    name: Joi.string(),
    workingHours: schemaHour
  });
  const result = Joi.validate(input, schemaDoctor);
  if (result.error) {
    return false;
  }
  return true;
}

// check the data to create appointment is valid
function checkValidAppointments(input) {
  const schema = {
    patientName: Joi.string(),
    doctorName: Joi.string(),
    appointDate: Joi.string().regex(date),
    appointTime: Joi.string().regex(time)
  };
  const result = Joi.validate(input, schema);
  if (result.error) {
    return false;
  }
  return true;
}

// check whether the time is in doctor's working time
function isWork(input, workingHours) {
  for (workingDate in workingHours) {
    if (input.appointDate === workingDate) {
      var inputTime = input.appointTime.split(":");
      var workTime = workingHours[workingDate].split(":");
      if (
        parseInt(inputTime[0]) >= parseInt(workTime[0]) &&
        parseInt(inputTime[1]) <= parseInt(workTime[1])
      ) {
        return true;
      }
    }
  }
  return false;
}

// check whether the time is open
function isOverLap(input, appointments) {
  for (appointment of appointments) {
    if (input.appointDate == appointment.appointDate) {
      var inputTime = input.appointTime.split(":");
      var appointTime = appointment.appointTime.split(":");
      if (
        parseInt(inputTime[0]) >= parseInt(appointTime[0]) &&
        parseInt(inputTime[1]) <= parseInt(appointTime[1])
      ) {
        return true;
      }
    }
  }
  return false;
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Listening on port ${port}"));
