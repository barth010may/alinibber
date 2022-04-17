import { tripServiceCallAPI } from "./rejseplanen.js";

export {createTripSelection, createNewTrip};

const tripBox = document.querySelector('.trip-box');

function createTripSelection(tripData) {
    tripServiceCallAPI(tripData).then((response) => {
        response.forEach(element => {
            console.log(element.Trip);
            createNewTrip(element.Trip);
        });
    });
}

function createNewTrip(tripElement) {
    let tripStartTime1 = tripElement['0']['Leg']['0'][':@']['@_time'];
    let tripEndTime1 = tripElement[tripElement.length-1]['Leg']['1'][':@']['@_time'];

    //Create html elements for the trip box
    let trip = document.createElement('div');
    trip.setAttribute('class', 'trip');

    let tripTop = document.createElement('div');
    tripTop.setAttribute('class', 'trip-top');

    let tripStart = document.createElement('div');
    tripStart.setAttribute('class', 'trip-start');
    let tripStartTime = document.createElement('span');

    let tripBar = document.createElement('div');
    tripBar.setAttribute('class', 'trip-bar'); 

    let bar = document.createElement('div');
    bar.setAttribute('class', 'bar');
    
    let tripEnd = document.createElement('div');
    tripEnd.setAttribute('class', 'trip-end');
    let tripEndTime = document.createElement('span');

    let tripInfo = document.createElement('div');
    tripInfo.setAttribute('class', 'trip-info');
    let tripSpecifiedInfo = document.createElement('span');


    let tripAction = document.createElement('trip-action');
    tripAction.setAttribute('class', 'trip-action');

    let detailsButton = document.createElement('div');
    detailsButton.setAttribute('class', 'details-button');
    detailsButton.append('Details');

    //Insert the right elements under the right parent-nodes
    tripBox.appendChild(trip);
    trip.appendChild(tripTop);
    tripTop.appendChild(tripStart);
    tripStart.appendChild(tripStartTime);
    tripTop.appendChild(tripBar);
    tripBar.appendChild(bar);

    let iconSpacings = calcIconSpacings(tripElement, bar.offsetWidth, tripStartTime1, tripEndTime1);

    getIconElements(tripElement, iconSpacings).forEach(element => {
        tripBar.appendChild(element);
    });

    tripTop.appendChild(tripEnd);
    tripEnd.appendChild(tripEndTime);
    trip.appendChild(tripInfo);
    tripInfo.appendChild(tripSpecifiedInfo);
    trip.appendChild(tripAction);
    tripAction.appendChild(detailsButton);
   

    let timeStart = new Date("01/01/2022 " + tripStartTime1);
    let timeEnd = new Date("01/01/2022 " + tripEndTime1);

    let timeDiff = timeEnd - timeStart;

    if(timeDiff < 0) {
        timeDiff += 1000*60*60*24;
    }

    let timeDiffHours = Math.floor(timeDiff/1000/60/60);
    let timeDiffMinutes = Math.floor(timeDiff/1000/60) - timeDiffHours*60;


    tripStartTime.textContent = tripStartTime1;
    tripEndTime.textContent = tripEndTime1;
    if (timeDiffHours > 0){
        tripSpecifiedInfo.textContent  = timeDiffHours+" h "+timeDiffMinutes+" min, "+countTripChanges(tripElement)+" changes";
    }else{
        tripSpecifiedInfo.textContent  = timeDiffMinutes+" min, "+countTripChanges(tripElement)+" changes";
    } 

}

function getIconElements(tripElement, iconSpacings) {
    let iconElement = [];

    let i = 0;
    tripElement.forEach(element => {
        if(i != 0 && (element['Leg']['0'][':@']['@_name'].toLowerCase().includes(element['Leg']['1'][':@']['@_name'].toLowerCase()) || element['Leg']['1'][':@']['@_name'].toLowerCase().includes(element['Leg']['0'][':@']['@_name'].toLowerCase()))) {
            i++;
            return;
        }
        let tripIconContainer = document.createElement('div');
        tripIconContainer.setAttribute('class', 'trip-icon');

        if(i != 0 && iconSpacings[i] - iconSpacings[i-1] < 35) {
            tripIconContainer.style.setProperty('--icon-space', (iconSpacings[i-1] + 35) + 'px'); i++;
        }
        else {
            tripIconContainer.style.setProperty('--icon-space', iconSpacings[i] + 'px'); i++;
        }
        
        let tripIcon = document.createElement('i');
        let tripName = document.createElement('span');

        switch (element[':@']['@_type']) {
            case "WALK":
                tripIcon.setAttribute('class', 'fa-solid fa-person-walking');
                break;
            case "BUS": case "EXB": case "TOG": case "NB": case "TB":
                tripIcon.setAttribute('class', 'fa-solid fa-bus-simple');
                tripName.textContent = element[':@']['@_line'];
                break;
            case "IC": case "LYN": case "REG": case "S": case "M":
                tripIcon.setAttribute('class', 'fa-solid fa-train');
                tripName.textContent = element[':@']['@_name'];
                break;
            case "F":
                tripIcon.setAttribute('class', 'fa-solid fa-ferry');
                break;
            default:
                tripIcon.setAttribute('class', 'fa-solid fa-question');
                break;
        }

        tripIconContainer.appendChild(tripIcon);
        tripIconContainer.appendChild(tripName);
        iconElement.push(tripIconContainer);
    });

    return iconElement;
}

function calcIconSpacings(tripElement, barWidth, startTime, endTime){    
    const tripTimes = getTripMinutes(tripElement);
    
    let tripTimesSum = tripTimes.reduce((a, b) => a + b, 0);
    let frac = barWidth/tripTimesSum;
    console.log('WIDTH: '+barWidth);
    
    let iconSpacings = [];
    let j = 0
    let time = 0;

    for(let i = 0; i < tripElement.length; i++){
        if(i == 0) {
            iconSpacings.push(0);
        }
        else if(i == tripElement.length-1){
            iconSpacings.push((time+tripTimes[j])*frac);
        }
        else{
            time += tripTimes[j] + tripTimes[j+1];
            iconSpacings.push(time*frac);
            j += 2;
        }
    }
    
    return iconSpacings;
}

function getTripMinutes(data) {
    let tripTimes = [];

    data.forEach(element => {
        tripTimes.push({origin: element['Leg']['0'][':@']['@_time'], destination: element['Leg']['1'][':@']['@_time']});
    });

    let tripTimeDiffs = [];
    let previousDest = 0;''

    tripTimes.forEach(tripTime => {
        if (previousDest != 0) {
            let timeDiff = new Date("01/01/2022 " + tripTime.origin) - new Date("01/01/2022 " + previousDest);
            
            if (timeDiff < 0) {
                timeDiff += 1000*60*60*24;
            }
            tripTimeDiffs.push(timeDiff/1000/60);
        }

        let timeDiff = new Date("01/01/2022 " + tripTime.destination) - new Date("01/01/2022 " + tripTime.origin);
        if(timeDiff < 0) {
            timeDiff += 1000*60*60*24;
        }
        previousDest = tripTime.destination;
        tripTimeDiffs.push(timeDiff/1000/60);
    });

    return tripTimeDiffs;
}
/* 
let timeStart = new Date("01/01/2022 " + tripStartTime1);
let timeEnd = new Date("01/01/2022 " + tripEndTime1);

let timeDiff = timeEnd - timeStart;

if(timeDiff < 0) {
    timeDiff += 1000*60*60*24;
}

let timeDiffHours = Math.floor(timeDiff/1000/60/60);
let timeDiffMinutes = Math.floor(timeDiff/1000/60) - timeDiffHours*60;
 */
function getNumOfTrips(data) {
    let counter = 0;
    
    data.forEach(element => {
        counter++;
    });

    return counter;
}

function countTripChanges(data) {
    let counter = 0;
    
    data.forEach(element => {
        if (element[':@']['@_type'] !== "WALK") {
            counter++;
        }
    });

    return counter-1;
}
