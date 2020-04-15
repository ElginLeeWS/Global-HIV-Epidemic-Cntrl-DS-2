/*
Copyright 2018 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

window.addEventListener('offline', () => {
  messageOffline(true)
});

window.addEventListener('online', () => {
  // Update your UI to reflect that the connection is back.
  messageOffline(false)
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log(`Service Worker registered! Scope: ${registration.scope}`);
      })
      .catch(err => {
        console.log(`Service Worker registration failed: ${err}`);
      });
  });
}

const container = document.getElementById('container');
const offlineMessage = document.getElementById('offline');
const onlineMessage = document.getElementById('online');
const noDataMessage = document.getElementById('no-data');
const dataSavedMessage = document.getElementById('data-saved');
const saveErrorMessage = document.getElementById('save-error');
const dataErrorMessage = document.getElementById('data-error');
const addEventButton = document.getElementById('add-event-button');

addEventButton.addEventListener('click', addAndPostEvent);

Notification.requestPermission();

const dbPromise = createIndexedDB();

loadContentNetworkFirst();

//set the default date
set_test_date_to_today();

function loadContentNetworkFirst() {
  getServerStatus()
  .then(dataFromNetwork => {
    //obviously we are online - let us know
    messageOffline(false)
    .then(() => {
      setLastUpdated(new Date());
      anyCachedDataHaveBeenPosted();
    }).catch(err => {
      messageSaveError();
      console.warn(err);
    });
  }).catch(err => {
    console.log('Network requests have failed, this is expected if offline');
  });
}

/* Network functions */
function getServerStatus() {
  return fetch('https://apps.hdap.gatech.edu/hapiR4/baseR4/metadata').then(response => {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return true;
  });
}

function addAndPostEvent(e) {
  console.log("in addAndPostEvent");
  e.preventDefault();
  const data = {
    id: Date.now(),
    hts_id_number: document.getElementById('hts_id_number').value,
    first_name: document.getElementById('first_name').value,
    middle_name: document.getElementById('middle_name').value,
    last_name: document.getElementById('last_name').value,
    birth_date: document.getElementById('birth_date').value,
    age: document.getElementById('age').value,
    sex: getChosenOption(document.getElementsByName('sex')),
    pregnant: getChosenOption(document.getElementsByName('pregnant')),
    village: getChosenOption(document.getElementsByName('village')),
    previous_test: getChosenOption(document.getElementsByName('previous_test')),
    prior_test_date: document.getElementById('prior_test_date').value,
    accepted_test: getChosenOption(document.getElementsByName('accepted_test')),
    test_date: document.getElementById('test_date').value,
    determine_assay: getChosenOption(document.getElementsByName('determine_assay')),
    determine_result: getChosenOption(document.getElementsByName('determine_result')),
    uni_gold_assay:  getChosenOption(document.getElementsByName('uni_gold_assay')),
    uni_gold_result:  getChosenOption(document.getElementsByName('uni_gold_result')),
    sd_bioline_assay:  getChosenOption(document.getElementsByName('sd_bioline_assay')),
    sd_bioline_result: getChosenOption(document.getElementsByName('sd_bioline_result')),
    result_received:  getChosenOption(document.getElementsByName('result_received')),
    appointment_date: document.getElementById('appointment_date').value,
    appointment_location: getChosenOption(document.getElementsByName('appointment_location')),
  };

  if (validateInput(data) === false) {
    messageDataError(true);
    return;
  }
  messageDataError(false);
  // updateUI([data]);
  resetForm();
  addToServer(data)
      .catch(err => {
        console.log('Network requests have failed, this is expected if offline');
        // saveEventDataLocally([data]);
      });
  dataSavedMessage.textContent = 'Message Saved. ';
  dataSavedMessage.style.display = 'block';
}

function populateForFHIR(data){


    let patient =`{"resource":{"resourceType":"Patient","identifier":[{"use":"usual","system":"Team36Project","value":"${data.hts_id_number}"}],"name":[{"family":"${data.last_name}","given":["${data.first_name}","${data.middle_name}"]}],"birthday":"${data.birth_date}","gender":"${data.sex}","address":[{"city":"${data.village}"}]},"request":{"method":"POST"}}`;

    let condition =`,{"resource":{"resourceType":"Condition","identifier":[{"use":"usual","system":"Team36Project","value":"self_report/${data.hts_id_number}"}],"clinicalStatus":{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/condition-clinical","code":"active"}]},"verificationStatus":{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/condition-ver-status","code":"provisional"}]},"code":{"coding":[{"system":"http://snomed.info/sct","code":"278977008","display":"HIVStatus"}]},"subject":{"reference":"Patient/${data.hts_id_number}","display":"${data.first_name} ${data.middle_name} ${data.last_name}"},"note":{"text":"${data.result_received}"}},"request":{"method":"POST"}}`;

    let prior_test = `,{"resource":{"resourceType":"DiagnosticReport","identifier":[{"use":"usual","system":"Team36Project","value":"prior_test/${data.hts_id_number}"}],"effectiveDateTime":"${data.prior_test_date}","status":"registered","subject":{"reference":"Patient/${data.hts_id_number}","display":"${data.first_name} ${data.middle_name} ${data.last_name}"},"conclusion":"${data.previous_test} ${data.prior_test_date}"},"request":{"method":"POST"}}`;

    let pregnant_no = `,{"resource":{"resourceType":"Observation","meta":{"profile":["http://hl7.org/fhir/us/ecr/StructureDefinition/pregnancy-status"]},"status":"registered","code":{"coding":[{"system":"http://loinc.org","code":"82810-3","display":"Pregnancy status"}]},"subject":{"reference":"Patient/${data.hts_id_number}","display":"${data.first_name} ${data.middle_name} ${data.last_name}"},"valueCodeableConcept":{"coding":[{"system":"http://snomed.info/sct","code":"60001007","display":"Not pregnant"}]}},"request":{"method":"POST"}}`;

    let pregnant_yes = `,{"resource":{"resourceType":"Observation","meta":{"profile":["http://hl7.org/fhir/us/ecr/StructureDefinition/pregnancy-status"]},"status":"registered","code":{"coding":[{"system":"http://loinc.org","code":"82810-3","display":"Pregnancy status"}]},"subject":{"reference":"Patient/${data.hts_id_number}","display":"${data.first_name} ${data.middle_name} ${data.last_name}"},"valueCodeableConcept":{"coding":[{"system":"http://snomed.info/sct","code":"77386006","display":"Pregnant"}]}},"request":{"method":"POST"}}`;

    let diagnostic_determine = `,{"resource":{"resourceType":"DiagnosticReport","identifier":[{"use":"usual","system":"Team36Project","value":"determine/${data.hts_id_number}"}],"effectiveDateTime":"${data.test_date}","status":"registered","subject":{"reference":"Patient/${data.hts_id_number}","display":"${data.first_name} ${data.middle_name} ${data.last_name}"},"conclusion":"${data.determine_result}"},"request":{"method":"POST"}}`;

    let diagnostic_uni_gold = `,{"resource":{"resourceType":"DiagnosticReport","identifier":[{"use":"usual","system":"Team36Project","value":"uni_gold/${data.hts_id_number}"}],"effectiveDateTime":"${data.test_date}","status":"registered","subject":{"reference":"Patient/${data.hts_id_number}","display":"${data.first_name} ${data.middle_name} ${data.last_name}"},"conclusion":"${data.uni_gold_result}"},"request":{"method":"POST"}}`;

    let diagnostic_sd_bioline = `,{"resource":{"resourceType":"DiagnosticReport","identifier":[{"use":"usual","system":"Team36Project","value":"sd_bioline/${data.hts_id_number}"}],"effectiveDateTime":"${data.test_date}","status":"registered","subject":{"reference":"Patient/${data.hts_id_number}","display":"${data.first_name} ${data.middle_name} ${data.last_name}"},"conclusion":"${data.sd_bioline_result}"},"request":{"method":"POST"}}`;

    let appointment = `,{"resource":{"resourceType":"Appointment","status":"pending","description":"HIV Followup  Care","reasonCode":[{"coding":[{"system":"http://snomed.info/sct","code":"278977008"}],"text":"HIVStatus"}],"created":"${data.appointment_date}","participant":[{"actor":{"reference":"Patient/${data.hts_id_number}","display":"${data.first_name} ${data.middle_name} ${data.last_name}"},"required":"required","status":"tentative"},{"actor":{"reference":"Location/${data.appointment_location}","display":"${data.appointment_location}"},"required":"required","status":"tentative"}]},"request":{"method":"POST"}}`;

    let location = `,{"resource":{"resourceType":"Location","identifier":[{"use":"usual","system":"Team36Project","value":"Location/${data.appointment_location}"}],"status":"active","name":"${data.appointment_location}"},"request":{"method":"POST"}}`;

    if (data.sex === "male") {
        pregnant_no = ``;
        pregnant_yes =``;
    } else {
        if (data.pregnant === undefined || data.pregnant === 'yes')
            pregnant_no = ``;
        else
            pregnant_yes =``;
    }

    if (data.prior_test_date === undefined || data.prior_test_date === '')
        prior_test=``;

    if (data.determine_assay === undefined || data.determine_assay !== 'on')
        diagnostic_determine = ``;

    if (data.uni_gold_assay === undefined || data.uni_gold_assay !== 'on')
        diagnostic_uni_gold = ``;

    if (data.sd_bioline_assay === undefined || data.sd_bioline_assay !== 'on')
        diagnostic_sd_bioline = ``;

    if (data.appointment_date === "") {
        appointment = ``;
        location = ``;
    }


    let fhir_str = `{"resourceType":"Bundle","type":"transaction","entry":[${patient}${prior_test}${pregnant_no}${pregnant_yes}${diagnostic_determine}${diagnostic_uni_gold}${diagnostic_sd_bioline}${condition}${appointment}${location}]}`;


    return fhir_str.toString();
}

function addToServer(data) {

  const headers = new Headers({'Content-Type': 'application/json'});

  url = 'https://apps.hdap.gatech.edu/hapiR4/baseR4';
  const body = populateForFHIR(data);
  return fetch(url, {
  // return fetch('api/add', {
    method: 'POST',
    headers: headers,
    body: body
  });
}

function messageOffline(offline) {
  const lastUpdated = getLastUpdated();
  if (offline) {
    offlineMessage.textContent = 'Dev Message: You are offline. Data will be cached and updated in the background when connected to the FHIR server. ';
    // alert user that data may not be current
    if (lastUpdated) {
      offlineMessage.textContent += 'Last server post: ' + lastUpdated;
    }
    offlineMessage.style.display = 'block';
    onlineMessage.style.display = 'none';
  }
  else {
    onlineMessage.textContent = 'Dev Message: You are online. Data will be written directly to the FHIR server. ';
    if (lastUpdated) {
      onlineMessage.textContent += 'Last server post: ' + lastUpdated;
    }
    onlineMessage.style.display = 'block';
    offlineMessage.style.display = 'none';
  }
}

function messageNoData() {
  // alert user that there is no data available
  noDataMessage.style.display = 'block';
}

function anyCachedDataHaveBeenPosted() {
  // alert user that data has been saved to the server
  dataSavedMessage.textContent = 'Any cached data has been posted to the FHIR Server. ';
  // alert user that data may not be current
  if (lastUpdated) {
    offlineMessage.textContent += ' Last server post: ' + lastUpdated;
  }
  offlineMessage.style.display = 'block';
  onlineMessage.style.display = 'none';

  const lastUpdated = getLastUpdated();
  if (lastUpdated) {dataSavedMessage.textContent += ' on ' + lastUpdated;}
  dataSavedMessage.style.display = 'block';
}

function messageSaveError() {
  // alert user that data couldn't be saved offline
  saveErrorMessage.style.display = 'block';
}

function messageDataError(show) {
  // alert user that required data was missing
  if (show) {
    dataErrorMessage.style.display = 'block';
    dataSavedMessage.style.display = 'none';
  }
  else
    dataErrorMessage.style.display = 'none';
}


/* Storage functions */

function getLastUpdated() {
  return localStorage.getItem('lastUpdated');
}

function setLastUpdated(date) {
  localStorage.setItem('lastUpdated', date);
}

function createIndexedDB() {
  if (!('indexedDB' in window)) {return null;}
  return idb.open('globalHIV', 1, function(upgradeDb) {
    if (!upgradeDb.objectStoreNames.contains('events')) {
      const eventsOS = upgradeDb.createObjectStore('events', {keyPath: 'id'});
    }
  });
}

//data entry support functions
function yes_or_no(master_id, slave1_id) {
  if (document.getElementById(master_id).checked) {
    document.getElementById(slave1_id).style.display = 'block';
  } else {
    document.getElementById(slave1_id).style.display = 'none';
  }
}

function calculate_age(birthDate) {
  const dob = moment(birthDate);
  document.getElementById('age').value = moment(Date.now()).diff(dob, 'years');
}

function clear_dob() {
  document.getElementById('birth_date').value = "";
}

function set_test_date_to_today() {
  Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
  });
  document.getElementById('test_date').value = new Date().toDateInputValue();
}

function determine_enabled() {
  if (document.getElementById('determine_assay').checked) {
    document.getElementById('determine_result_negative').disabled = false;
    document.getElementById('determine_result_positive').disabled = false;
    document.getElementById('determine_result_indeterminate').disabled = false;
  } else {
    document.getElementById('determine_result_negative').disabled = true;
    document.getElementById('determine_result_positive').disabled = true;
    document.getElementById('determine_result_indeterminate').disabled = true;
    document.getElementById('determine_result_negative').checked = false;
    document.getElementById('determine_result_positive').checked = false;
    document.getElementById('determine_result_indeterminate').checked = false;
  }
}

function uni_gold_enabled() {
  if (document.getElementById('uni_gold_assay').checked) {
    document.getElementById('uni_gold_result_negative').disabled = false;
    document.getElementById('uni_gold_result_positive').disabled = false;
    document.getElementById('uni_gold_result_indeterminate').disabled = false;
  } else {
    document.getElementById('uni_gold_result_negative').disabled = true;
    document.getElementById('uni_gold_result_positive').disabled = true;
    document.getElementById('uni_gold_result_indeterminate').disabled = true;
    document.getElementById('uni_gold_result_negative').checked = false;
    document.getElementById('uni_gold_result_positive').checked = false;
    document.getElementById('uni_gold_result_indeterminate').checked = false;

  }
}

function bioline_enabled() {
  if (document.getElementById('sd_bioline_assay').checked) {
    document.getElementById('sd_bioline_result_negative').disabled = false;
    document.getElementById('sd_bioline_result_positive').disabled = false;
    document.getElementById('sd_bioline_result_indeterminate').disabled = false;
  } else {
    document.getElementById('sd_bioline_result_negative').disabled = true;
    document.getElementById('sd_bioline_result_positive').disabled = true;
    document.getElementById('sd_bioline_result_indeterminate').disabled = true;
    document.getElementById('sd_bioline_result_negative').checked = false;
    document.getElementById('sd_bioline_result_positive').checked = false;
    document.getElementById('sd_bioline_result_indeterminate').checked = false;

  }
}

function getChosenOption(options) {
  var chosen;
  for(var i = 0; i < options.length; i++) {
    if(options[i].checked) {
      chosen = options[i].value;
      break;
    }
  }
  return chosen;
}

function validateInput(event) {
  if (event.hts_id_number === "")
    return false;
  if (event.first_name  === "")
    return false;
  if (event.last_name  === "")
    return false;
  if (event.age  === "")
    return false;
  if (event.sex  === undefined)
    return false;
  if (event.sex  === "female" && event.pregnant === undefined)
    return false;
  if (event.village === undefined)
    return false;
  if (event.previous_test === undefined)
    return false;
  if (event.previous_test  === "yes" && event.prior_test_date === "")
    return false;
  if (event.accepted_test === undefined)
    return false;
  if (event.test_date === "")
    return false;
  if (event.determine_assay  === "on" && event.determine_result === undefined)
    return false;
  if (event.uni_gold_assay  === "on" && event.uni_gold_result === undefined)
    return false;
  if (event.sd_bioline_assay  === "on" && event.sd_bioline_result === undefined)
    return false;
  if (event.determine_assay  !== "on" && event.uni_gold_assay  !== "on" && event.sd_bioline_assay  !== "on")
    return false;
  if (event.result_received === undefined)
    return false;
  if (event.appointment_date  !== "" && event.appointment_location === undefined)
    return false;
  if (event.appointment_date  === "" && event.appointment_location !== undefined)
    return false;

  return true
}

function resetForm() {
  var frm = document.getElementsByName('client_data')[0];
  frm.reset();
  yes_or_no('sex_female', 'female_pregnant');
  yes_or_no('previous_test_yes', 'previous_test_date');
  set_test_date_to_today();
}