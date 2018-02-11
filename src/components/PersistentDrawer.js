import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Drawer from 'material-ui/Drawer';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';
import KeyboardArrowUp from 'material-ui-icons/KeyboardArrowUp';
import KeyboardArrowDown from 'material-ui-icons/KeyboardArrowDown';

const drawerWidth = 240;

const styles = theme => ({
  root: {
    width: '100%',
    height: 430,
    marginTop: theme.spacing.unit * 3,
    zIndex: 1,
    overflow: 'hidden',
  },
  appFrame: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '100%',
  },
  appBar: {
    position: 'absolute',
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  hide: {
    display: 'none',
  },
  drawerPaper: {
    position: 'relative',
    height: 240,
    width: '100%',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  content: {
    width: '100%',
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing.unit * 3,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    height: 'calc(100% - 56px)',
    marginTop: 56,
    [theme.breakpoints.up('sm')]: {
      height: 'calc(100% - 64px)',
      marginTop: 64,
    },
  },
  'content-bottom': {
    marginBottom: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  'contentShift-bottom': {
    marginBottom: 0,
  }
});

class PersistentDrawer extends React.Component {
  // props: open (boolean), onDrawerClose (callback), onDrawerOpen

  renderToggleIcon() {
    const { classes } = this.props;
    if (this.props.open) {
      return (
        <div className={classes.drawerHeader}>
          <IconButton onClick={this.props.onDrawerClose.bind(this)}>
            <KeyboardArrowDown />
          </IconButton>
        </div>
      );
    } else {
      return (
        <div className={classes.drawerHeader}>
          <IconButton onClick={this.props.onDrawerOpen.bind(this)}>
            <KeyboardArrowUp />
          </IconButton>
        </div>
      );
    }
  }

  render() {
    const { classes, open } = this.props;

    const drawer = (
      <Drawer
        variant="persistent"
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="bottom"
        open={open}
      >
        <div className={classes.drawerInner}>
          { this.renderToggleIcon() }
          <Divider />
          { this.props.contents }
        </div>
      </Drawer>
    );

    return (
      <div className={classes.root}>
        <div className={classes.appFrame}>
          {drawer}
        </div>
      </div>
    );
  }
}

PersistentDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(PersistentDrawer);