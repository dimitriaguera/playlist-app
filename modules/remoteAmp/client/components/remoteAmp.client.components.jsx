import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button } from 'semantic-ui-react';
import { get } from 'core/client/services/core.api.services';


class RemoteAmp extends Component {

  constructor() {
    super();
    this.handlerClickOnOff = this.handlerClickOnOff.bind(this);
    this.state = {
      response: null
    };
  }

    handlerClickOnOff( opt ) {
    const _self = this;
      return (e) => {
        this.props.clickOnOff( opt )
          .then( data => {

            if (!data.success){

            }
            _self.setState( {response: data.msg});
          });
      }
    }


    render(){

      const { response } = this.state;


        return (
          <div>
            <h1>Remote Amp</h1>
            <section>
              {response}
              <Button type='button' onClick={this.handlerClickOnOff('KEY_POWER')} content='On' color='blue'/>
              <Button type='button' onClick={this.handlerClickOnOff('off')} content='Off' color='red'/>

              {/*<Button type='button' onClick={this.handlerClickOnOff('KEY_CD')} content='Cd' color='green'/>*/}
              {/*<Button type='button' onClick={this.handlerClickOnOff('KEY_TUNER')} content='Tuner' color='green'/>*/}
              <Button type='button' onClick={this.handlerClickOnOff('KEY_AUX')} content='Rasp' color='green'/>

              <Button type='button' onClick={this.handlerClickOnOff('KEY_VOLUMEUP')} content='Volume +' color='blue'/>
              <Button type='button' onClick={this.handlerClickOnOff('KEY_VOLUMEDOWN')} content='Volume -' color='blue'/>
              <Button type='button' onClick={this.handlerClickOnOff('KEY_MUTE')} content='Mute' color='blue'/>

            </section>
          </div>
        );
    }
}

const mapStateToProps = state => {
  return {
    loading: state.apiStore.isFetching,
  }
};

const mapDispatchToProps = ( dispatch ) => {
  return {
    clickOnOff: (opt) => {
      return dispatch(
        get( 'remoteAmp/' + opt )
      )
    }
  }
};


const RemoteAmpContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(RemoteAmp);

export default RemoteAmpContainer