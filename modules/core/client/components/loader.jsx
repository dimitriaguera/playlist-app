import React from 'react'
import { connect } from 'react-redux'
import { Loader } from 'semantic-ui-react'

const CustomLoader = ({loading, fetching}) => <Loader inverted active={loading || fetching} />;

const mapStateToProps = state => {
  return {
    loading: state.apiStore.isFetching,
    fetching: state.authenticationStore.isFetching
  }
};

const CustomLoaderContainer = connect(
  mapStateToProps,
  null
)(CustomLoader);


export default CustomLoaderContainer
