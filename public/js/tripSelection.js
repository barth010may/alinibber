import { getIconElements, calcIconSpacings } from './tripIcons.js';
import { tripServiceCallAPI } from './rejseplanen.js';
import { createDetailsBox } from './tripDetails.js';
import { convertToDate } from './dateConverter.js';

export { createTripSelection, createNewTrip, selectedTripObject, selectedTrip };

export function setSelectedTripObject(value) {
    selectedTripObject = value;
}
let selectedTripObject = '';
let selectedTrip = '';

function createTripSelection(tripData, tripBox) {
    deleteList(tripBox);

    tripServiceCallAPI(tripData).then((response) => {
        response.forEach((element) => {
            console.log(element.Trip);
            createNewTrip(element.Trip, tripBox);
        });
    });
}

function createNewTrip(tripElement, tripBox) {
    let tripTimeStart = tripElement['0']['Leg']['0'][':@']['@_time'];
    let tripTimeEnd = tripElement[tripElement.length - 1]['Leg']['1'][':@']['@_time'];

    //Create html elements for the trip box
    let trip = document.createElement('div');
    trip.setAttribute('class', 'trip');
    trip.addEventListener('click', (event) => {
        tripBox.childNodes.forEach((element) => {
            element.classList.remove('trip-selected');
        });
        trip.classList.add('trip-selected');
        let addBtn = tripBox.parentElement.children[2].children[1];
        addBtn.classList.remove('disabled');
        selectedTripObject = tripElement;
        selectedTrip = trip;
    });

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

    let tripAction = document.createElement('div');
    tripAction.setAttribute('class', 'trip-action');

    let detailsButton = document.createElement('div');
    detailsButton.setAttribute('class', 'details-button');
    detailsButton.append('Details');

    detailsButton.addEventListener(
        'click',
        (e) => {
            createDetailsBox(e.target.parentNode.parentNode, tripElement);

            detailsButton.addEventListener('click', (e) => {
                let x = e.target.parentNode.parentNode.nextSibling;

                if (x.style.display == 'block') {
                    x.style.display = 'none';
                } else if (x.style.display == 'none') {
                    x.style.display = 'block';
                }
            });
        },
        { once: true }
    );

    //Insert the right elements under the right parent-nodes
    tripBox.appendChild(trip);
    trip.appendChild(tripTop);
    tripTop.appendChild(tripStart);
    tripStart.appendChild(tripStartTime);
    tripTop.appendChild(tripBar);
    tripBar.appendChild(bar);

    let iconSpacings = calcIconSpacings(tripElement, bar.offsetWidth, tripTimeStart, tripTimeEnd);

    getIconElements(tripElement, iconSpacings).forEach((element) => {
        tripBar.appendChild(element);
    });

    tripTop.appendChild(tripEnd);
    tripEnd.appendChild(tripEndTime);
    trip.appendChild(tripInfo);
    tripInfo.appendChild(tripSpecifiedInfo);
    trip.appendChild(tripAction);
    tripAction.appendChild(detailsButton);


    let dateStart =  tripElement['0']['Leg']['0'][':@']['@_date'];
    let dateEnd = tripElement[tripElement.length - 1]['Leg']['1'][':@']['@_date'];

    dateStart = convertToDate(dateStart);
    dateEnd = convertToDate(dateEnd);

    let dateStartObj = new Date(dateStart + ' ' + tripTimeStart);
    let dateEndObj = new Date(dateEnd + ' ' + tripTimeEnd);

    let timeDiff = dateEndObj - dateStartObj;

    let timeDiffHours = Math.floor(timeDiff / 1000 / 60 / 60);
    let timeDiffMinutes = Math.floor(timeDiff / 1000 / 60) - timeDiffHours * 60;

    tripStartTime.textContent = tripTimeStart;
    tripEndTime.textContent = tripTimeEnd;
    if (timeDiffHours > 0) {
        tripSpecifiedInfo.textContent =
            timeDiffHours + ' h ' + timeDiffMinutes + ' min, ' + countTripChanges(tripElement) + ' changes';
    } else {
        tripSpecifiedInfo.textContent = timeDiffMinutes + ' min, ' + countTripChanges(tripElement) + ' changes';
    }
}

function countTripChanges(data) {
    let counter = 0;

    data.forEach((element) => {
        if (element[':@']['@_type'] !== 'WALK') {
            counter++;
        }
    });

    return counter - 1;
}

function deleteList(tripBox) {
    tripBox.textContent = '';
}
