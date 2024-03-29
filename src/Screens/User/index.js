import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text
} from 'react-native';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-community/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import EStyleSheet from 'react-native-extended-stylesheet';
import Toast from 'react-native-simple-toast';
import Dialog, {DialogContent, DialogFooter, DialogButton} from 'react-native-popup-dialog';
import { getDisplay } from 'react-native-device-info';
import { random } from 'lodash';

const User = (props) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [flag, setFlag] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [passwordId, setPasswordId] = useState('');
  EStyleSheet.build({
    $theme: global.theme
  });

  useEffect(() => {
    const unscribe = props.navigation.addListener('didFocus', () => {
      EStyleSheet.build({
        $theme: global.theme
      });
      setFlag(1);
    })
    const unblur = props.navigation.addListener('didBlur', () => {
      setFlag(0);
    })
    return () => {
      unblur.remove();
      unscribe.remove();
    }
  }, [])

  const rearrange = (text) => {
    let reg = /\+?1?\s*\(?-*\.*(\d{3})\)?\.*-*\s*(\d{3})\.*-*\s*(\d{4})$/
    let format = text.replace(reg, '$1-$2-$3');
    setPhone(format)
  }

  const onFocus = () => {
    setIsFocus(true);
  }

  const onBlur = () => {
    setIsFocus(false);
  }

  const getNumberUserID = () => {
    if(passwordId != '') {
      firestore()
      .collection('users')
      .where('phone', '==', '+1 '+phone)
      .get()
      .then(querysnapshot => {
        let userID=''
        querysnapshot.forEach(doc => {
          userID = doc.data().password
        })
        if (userID == passwordId) {
            AsyncStorage.setItem('phoneNumber', '+1 '+phone)
            AsyncStorage.setItem('userName', name)
            AsyncStorage.setItem('userNumberID', passwordId)
            setName('');
            setPhone('');
            setVisible(false)
            props.navigation.goBack();
        } else {
          Toast.show('Your ID is not correct');
        }
      })
      
    } else {
      Toast.show('Please type UserID');
    }
  }

  const addUser = async() => {

    if(name == '' && phone == '')
    {
      return
    }


    const ref = firestore().collection('users');
    if (name != '' && phone != ''){
      console.log('phone===',phone)
      firestore()
        .collection('users')
        .where('phone', '==', '+1 '+phone)
        .get()
        .then(querysnapshot => {
          let docId = ''
          let password_id = random(999999)
          if (password_id<100000) {
            password_id += 100000;
          }
          querysnapshot.forEach(doc => {
            docId = doc.id
          })
          console.log("docId====",docId)
          if (docId == ''){
            ref.add({
              name: name,
              phone: '+1 '+phone,
              password: password_id.toString(),
              deviceId: global.DeviceId
            })
            .then(async(res) => {
              let docref = firestore().collection('users').doc(res.id);
              await docref.update({
                id: res.id,
                timestamp: firestore.FieldValue.serverTimestamp()
              }).then(async() => {
                AsyncStorage.setItem('phoneNumber', '+1 '+phone)
                AsyncStorage.setItem('userName', name)
                AsyncStorage.setItem('userNumberID', password_id.toString())
                console.log(password_id);
                setVisible(false)
                setName('');
                setPhone('');
                Toast.show('Go to Setting Page and Remember your password');
                props.navigation.goBack();
              })
            })
          } else {
            setVisible(true);
            // Toast.show('Already user exist')
          }
      })
      
    }
    else{
      setVisible(false)
    }
  }

  return (
    <View style={styles.container}>
      <Header title='User' navigation={props.navigation}/>
      <KeyboardAwareScrollView style={{marginTop: Platform.OS == 'ios'?150:80}}>
        <Text style={{textAlign: 'center', fontFamily: 'Roboto-Medium', fontSize: 22, marginBottom: 20}}>Please Input Your Info</Text>
        <CustomInput 
          inputWrapperStyle={{
              marginBottom: 20,
              paddingLeft:10
          }}
          value={name}
          placeholder="enter your name"
          placeholderTextColor="#6C6C6C"
          onChangeText={(text)=>setName(text)}
        />
        <CustomInput 
          inputWrapperStyle={{
              marginBottom: 40,
              paddingLeft:10
          }}
          phone={true}
          value={phone}
          focusvalue = {isFocus}
          onFocus = {() => onFocus()}
          placeholder="enter mobile phone(US)"
          keyboardType='numeric'
          placeholderTextColor="#6C6C6C"
          onChangeText={(text)=>rearrange(text)}
        />
        <CustomButton 
          ButtonStyle={{marginBottom: 20, backgroundColor: (name == '' || phone == '')?'lightgray':'#ACE4E4'}}
          textValue='Register'
          onPress={addUser}
        />
        <CustomButton 
          ButtonStyle={{marginBottom: 20, backgroundColor: '#E5D9E5'}}
          textValue='Back'
          onPress={() => props.navigation.goBack()}
        />      
      </KeyboardAwareScrollView>
      <Dialog
          visible={visible}
          footer={
            <DialogFooter>
              <DialogButton
                text="OK"
                onPress={getNumberUserID}
              />
              <DialogButton
                text="Cancel"
                onPress={() => {setVisible(false)}}
              />
            </DialogFooter>
          }
          onTouchOutside={() => {
              setVisible(false);
          }}
          dialogStyle={styles.dialogStyle}
          >
          <DialogContent>
            <View style={{justifyContent: 'center', alignItems:'center'}}>
              <Text style={{fontSize: 18, fontFamily: 'Roboto-Bold'}}>
                Please Type your Password
              </Text>
              <CustomInput 
                inputWrapperStyle={{
                    marginTop: 20,
                }}
                value={passwordId}
                placeholder="Enter your Password"
                placeholderTextColor="#6C6C6C"
                onChangeText={(text)=>setPasswordId(text)}
              />
            </View>
          </DialogContent>
        </Dialog>
    </View>
);
}

const styles = EStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '$theme.background'
    },
    background: {
      height:135,
      backgroundColor: '#E5D9E5',
      borderBottomLeftRadius: 30, 
      borderBottomRightRadius: 6,
    },
    itemImageViewStyle: {
      width: 55, 
      height:55, 
      borderRadius:10, 
      justifyContent:'center', 
      alignItems: 'center'
    },
    dashline : {
      borderWidth: 1,
      borderColor: '#ECE8EE',
      marginVertical: 15
    },
    itemImageTextStyle: {
      color: '#FFF', 
      fontSize: 18, 
      fontWeight: '800'
    },
    listViewStyle: {
      marginHorizontal: 20, 
      marginVertical: 10
    },
    dialogStyle: {
      paddingHorizontal: 50,
      paddingVertical: 25
    }
  });
export default User;
