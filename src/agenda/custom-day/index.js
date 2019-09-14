import React, {Component} from 'react';
import {
  FlatList,
  ActivityIndicator,
  View,
  ScrollView,
  Text,
  Dimensions
} from 'react-native';
import PropTypes from 'prop-types';
import XDate from 'xdate';

import dateutils from '../../dateutils';
import style from './style';

const { height, width } = Dimensions.get('window')

class ReactComp extends Component {
  
  static propTypes = {
    reservations: PropTypes.object,
    selectedDay: PropTypes.instanceOf(XDate),
  };

  constructor(props) {
    super(props);
    this.state = {
      reservations: []
    };
    this.heights=[];
    this.selectedDay = this.props.selectedDay;
    this.scrollOver = true;
  }

  componentWillMount() {
    this.updateDataSource(this.getReservations(this.props).reservations);
  }

  updateDataSource(reservations) {
    this.setState({
      reservations
    });
  }

  updateReservations(props) {
    const reservations = this.getReservations(props);
    if (this.list && !dateutils.sameDate(props.selectedDay, this.selectedDay)) {
      let scrollPosition = 0;
      for (let i = 0; i < reservations.scrollPosition; i++) {
        scrollPosition += this.heights[i] || 0;
      }
      this.scrollOver = false;
      this.list.scrollToOffset({offset: scrollPosition, animated: true});
    }
    this.selectedDay = props.selectedDay;
    this.updateDataSource(reservations.reservations);
  }

  componentWillReceiveProps(props) {
    if (!dateutils.sameDate(props.topDay, this.props.topDay)) {
      this.setState({
        reservations: []
      }, () => {
        this.updateReservations(props);
      });
    } else {
      this.updateReservations(props);
    }
  }

  onScroll(event) {
    const yOffset = event.nativeEvent.contentOffset.y;
    this.props.onScroll(yOffset);
    let topRowOffset = 0;
    let topRow;
    for (topRow = 0; topRow < this.heights.length; topRow++) {
      if (topRowOffset + this.heights[topRow] / 2 >= yOffset) {
        break;
      }
      topRowOffset += this.heights[topRow];
    }
    const row = this.state.reservations[topRow];
    if (!row) return;
    const day = row.day;
    const sameDate = dateutils.sameDate(day, this.selectedDay);
    if (!sameDate && this.scrollOver) {
      this.selectedDay = day.clone();
      this.props.onDayChange(day.clone());
    }
  }

  onRowLayoutChange(ind, event) {
    this.heights[ind] = event.nativeEvent.layout.height;
  }

  // renderRow({item, index}) {
  //   return (
  //     <View onLayout={this.onRowLayoutChange.bind(this, index)}>
  //       <Reservation
  //         item={item}
  //         renderItem={this.props.renderItem}
  //         renderDay={this.props.renderDay}
  //         renderEmptyDate={this.props.renderEmptyDate}
  //         theme={this.props.theme}
  //         rowHasChanged={this.props.rowHasChanged}
  //       />
  //     </View>
  //   );
  // }

  getReservationsForDay(iterator, props) {
    const day = iterator.clone();
    const res = props.reservations[day.toString('yyyy-MM-dd')];
    if (res && res.length) {
      return res.map((reservation, i) => {
        return {
          reservation,
          date: i ? false : day,
          day
        };
      });
    } else if (res) {
      return [{
        date: iterator.clone(),
        day
      }];
    } else {
      return false;
    }
  }

  onListTouch() {
    this.scrollOver = true;
  }

  getReservations(props) {
    if (!props.reservations || !props.selectedDay) {
      return {reservations: [], scrollPosition: 0};
    }
    let reservations = [];
    if (this.state.reservations && this.state.reservations.length) {
      const iterator = this.state.reservations[0].day.clone();
      while (iterator.getTime() < props.selectedDay.getTime()) {
        const res = this.getReservationsForDay(iterator, props);
        if (!res) {
          reservations = [];
          break;
        } else {
          reservations = reservations.concat(res);
        }
        iterator.addDays(1);
      }
    }
    const scrollPosition = reservations.length;
    const iterator = props.selectedDay.clone();
    for (let i = 0; i < 31; i++) {
      const res = this.getReservationsForDay(iterator, props);
      if (res) {
        reservations = reservations.concat(res);
      }
      iterator.addDays(1);
    }

    return {reservations, scrollPosition};
  }

  render() {
    const allEvents = this.props.reservations[this.props.selectedDay.toString('yyyy-MM-dd')];

    const dayEvents = [];
    const allDayEvents = [];

    if (allEvents) {
      allEvents.map(function(event) {
        if (event.allDay) {
          allDayEvents.push(event);
        }
        else {
          dayEvents.push(event);
        }
      })
    }

    return (
      <View style={style.main}>
        <ScrollView ref={this.refView} onContentSizeChange={this.onContentSizeChange.bind(this)}>
          {['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'].map(item => (
            <View style={style.hourView}>
              <View style={style.hourLine}>
                <View style={style.hourTextView}>
                  <Text style={style.hourText}>{item}:00</Text>
                </View>
                <View style={style.separator}></View>
              </View>
            </View>
          ))}
          {this.renderCurrentTimeMarker()}
          {this.renderDayEvents(dayEvents)}
        </ScrollView>
      </View>
    )
  }

  onContentSizeChange(contentWidth, contentHeight) {
    console.log(33, contentWidth, contentHeight)

    const date = new XDate();
    if (contentHeight > 1400 && date.diffDays(this.props.selectedDay) < 1 && date.getDate() === this.props.selectedDay.getDate()) {
      const offset = this.getDayMinute(date) - 180; // show in the middle of the screen
      if (offset > 0) // it can be < 0 if it's before 3am
        this.scrollViewRef.scrollTo({y: offset})
    }
  }

  refView = el => {
    this.scrollViewRef = el

    // const date = new XDate();
    // if (date.diffDays(this.props.selectedDay) < 1 && date.getDate() === this.props.selectedDay.getDate()) {
    //   console.log(11)
    //   this.scrollViewRef.scrollToEnd()
    // }
    console.log(22)
  }

  renderCurrentTimeMarker() {

    const date = new XDate();

    if (date.diffDays(this.props.selectedDay) > 1 || date.getDate() !== this.props.selectedDay.getDate()) {
      return null;
    }

    return (
      <View style={{backgroundColor: 'red', top: (this.getDayMinute(date) + 10), width: '100%', position: 'absolute', height: 1, marginLeft: 60}}/>
    )
  }

  getDayMinute(dt) {
    const date = new XDate(dt);
    return date.getHours() * 60 + date.getMinutes();
  }

  getEventsColumnMatrix(events) {
    const eventsColumns = [];
    let currentColumnEnd = []

    for (let i = 0 ; i < events.length ; i++) {

      const event = events[i];

      const start = this.getDayMinute(event.start);
      const end = this.getDayMinute(event.end);

      if (events[i+1] && this.getDayMinute(events[i+1].start) < end) { // case where the next has conflict with the current
        if (currentColumnEnd.length) { // there is already a conflict, adds another one
          let inserted = false
          for (let j = 0 ; j < currentColumnEnd.length ; j++) { // checks if there is an empty column to add event
            if (currentColumnEnd[j] < start) {
              if (!eventsColumns[start]) { // if they don't start in the same minute, inits the minute column
                eventsColumns[start] = []
              }
              eventsColumns[start][j] = event

              currentColumnEnd[j] = end;

              inserted = true
              break;
            }
          }
          if (!inserted) { // no empty column. Adds to end
            if (!eventsColumns[start]) { // if they don't start in the same minute, inits the minute column
              eventsColumns[start] = []
            }
            eventsColumns[start][currentColumnEnd.length] = event
            currentColumnEnd.push(end)
          }
        }
        else { // sets up the first column as the current event
          eventsColumns[start] = [event]
          currentColumnEnd.push(end)
        }
      }
      else if (currentColumnEnd.length) {
        if (!eventsColumns[start]) { // if they don't start in the same minute, inits the minute column
          eventsColumns[start] = []
        }
        eventsColumns[start][currentColumnEnd.length] = event
        currentColumnEnd = []
      }
      else { // no conflict
        currentColumnEnd = []
        eventsColumns[start] = [event]
      }
    }

    return eventsColumns
  }

  getBoxWidth(event, eventMatrix) {
    const start = this.getDayMinute(event.start);
    const end = this.getDayMinute(event.end);

    let columns = 1;
    for (let i = start ; i < end ; i++) {
      if (eventMatrix[i]) {
        const columnSize = eventMatrix[i].length;
        if (columnSize > columns) 
          columns = columnSize;
      }
    }

    if (columns > 1) {
      return (width - 80) / columns;
    }
    else {
      return (width - 120);
    }
  }

  // getBoxHeight(event) {
  //   const start = this.getDayMinute(event.start);
  //   const end = this.getDayMinute(event.end);

  //   return (end - start);
  // }

  // getTop(event) {
  //   const start = this.getDayMinute(event.start);
  //   return start + 10;
  // }

  // getLeft(idx) {
  //   return 60 + idx * 
  // }

  getEventBox(event, eventMatrix, j) {
    const start = this.getDayMinute(event.start);
    const end = this.getDayMinute(event.end);

    let height = (end - start) - 3;
    if (height < 20) {
      height = 20
    }
    const top = start + 10;
    const width = this.getBoxWidth(event, eventMatrix);
    const left = 60 + (j * width) + (j * 3)

    return (
      <View key={event.id} style={{backgroundColor: event.calendar.cardBackground, width, height, position:'absolute', top, left, 
                                   borderRadius: 5, paddingHorizontal: 5, overflow: 'hidden', opacity: 0.8}}>
        <Text style={{color: event.calendar.cardTextColor, fontWeight: 'bold'}}>{event.name}</Text>
      </View>
    )
  }

  renderDayEvents(dayEvents) {

    if (!dayEvents || !dayEvents.length)
      return null;

    console.log(dayEvents);

    dayEvents.sort(function(ev1, ev2) {
      const date1 = new XDate(ev1.start);
      const date2 = new XDate(ev2.start);
      return date1.getTime() - date2.getTime();
    })

    const eventMatrix = this.getEventsColumnMatrix(dayEvents);
    // console.log('1---', dayEvents)
    // console.log('---', eventMatrix)
    const events = [];

    for (let i = 0 ; i < eventMatrix.length ; i++) {
      const eventLine = eventMatrix[i]
      if (!eventLine)
        continue;

      for (let j = 0 ; j < eventLine.length ; j++) {
        const event = eventLine[j]
        if (!event)
          continue;

        events.push(this.getEventBox(event, eventMatrix, j))
      }
    }

    // dayEvents.map(item => {
    //   events.push(
    //     <Text key={item.id}>{item.name} {item.start}</Text>
    //   );
    // })

    return events
  }

//   render() {
//     if (!this.props.reservations || !this.props.reservations[this.props.selectedDay.toString('yyyy-MM-dd')]) {
//       if (this.props.renderEmptyData) {
//         return this.props.renderEmptyData();
//       }
//       return (
//         <ActivityIndicator style={{marginTop: 80}} color={this.props.theme && this.props.theme.indicatorColor} />
//       );
//     }
//     return (
//       <FlatList
//         ref={(c) => this.list = c}
//         style={this.props.style}
//         contentContainerStyle={this.styles.content}
//         renderItem={this.renderRow.bind(this)}
//         data={this.state.reservations}
//         onScroll={this.onScroll.bind(this)}
//         showsVerticalScrollIndicator={false}
//         scrollEventThrottle={200}
//         onMoveShouldSetResponderCapture={() => {this.onListTouch(); return false;}}
//         keyExtractor={(item, index) => String(index)}
//         refreshControl={this.props.refreshControl}
//         refreshing={this.props.refreshing || false}
//         onRefresh={this.props.onRefresh}
//       />
//     );
//   }
}

export default ReactComp;
