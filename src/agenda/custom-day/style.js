import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'gray'
  },
  hourView: {
    height: 60,
  },
  hourLine: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    width: '100%',
  },
  hourText: {
    color: 'rgba(0, 0, 0, 0.54)',
  },
  hourTextView: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'center'
  }
})
export default styles
