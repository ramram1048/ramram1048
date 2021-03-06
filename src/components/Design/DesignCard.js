import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import clsx from 'clsx'
import { useSnackbar } from 'notistack';
import { 
  Box,
  Grid,
  Card, 
  CardHeader, 
  CardActionArea, 
  CardContent, 
  CardMedia, 
  CardActions,
  Collapse,
  Chip,
  Button, Typography, Avatar, IconButton, ThemeProvider, Tooltip ,
  withWidth,
  Popover,
} from '@material-ui/core';
import {
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  PersonAdd as FollowIcon,
  PersonAddDisabled as UnfollowIcon,
  Clear,
  Done,
} from '@material-ui/icons'

import {yujinserver} from '../../restfulapi'
import { connect } from 'react-redux';
import { requestDesignLikes, requestDesignLikesCancel } from '../../actions/design'
import { requestUnfollow, requestFollow } from '../../actions/follow';
import { push } from 'connected-react-router';
import ChipInput from 'material-ui-chip-input';
import FollowButton from '../Community/FollowButton';
import NameAvatar from '../common/NameAvatar';
import ConfirmPopover from '../Closet/ConfirmPopover';


const useStyles = makeStyles((theme) => ({
  card: {
      padding: theme.spacing(1),
  },
  chips: {
    margin: "1px",
  },
  headerAction: {
    
  },
  popover: {
    pointerEvents: 'none',
  },
  cardMedia: {
    width: '100%',
    height: '100%',
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  product: {
    display: "flex",
  },
  productMedia: {
      paddingTop: "100%",
  },
  likes: {
    color: 'red',
  },
  follow: {
    color: theme.palette.info.main,
  }
}));


const DesignCard = ({sessionId, width, design, designStore, followStore, requestDesignLikes, requestDesignLikesCancel, requestFollow, requestUnfollow, dispatchPush}) => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const initialLikes = designStore.likeDesign.some((designId) => (designId === design.id));
  const [expanded, setExpanded] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [hashtags, setHashtags] = useState(design.hashtags.map((tag) => tag.title))
  const [hashtagEdit, setHashtagEdit] = useState(false)
  const [hashtagFormValue, setHashtagFormValue] =useState([])
  const [cardSize, setCardSize] = useState(1)
  const [popoverTarget, setPopoverTarget] = useState(null)
  // const [ userPopoverAnchor, setUserPopoverAnchor ] = useState(null)

  

  useEffect(() => {
    if(designStore.fetching !== "FAILURE"){
      if(designStore.likeDesign.some((designId) => (designId === design.id))) setLikes(true)
      else setLikes(false)
    }
    else{
      enqueueSnackbar("좋아요처리 실패",{"variant": "error"});
    }
  }, [designStore])

  useEffect(() => {
    setCardSize(cardSizeLookup[width])
  }, [width])

  const cardSizeLookup = {
    xs: 1,
    sm: 1,
    md: 1/2,
    lg: 1/2,
    xl: 1/4,
  }

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  const handleLikes = () => {
    if(likes){
      requestDesignLikesCancel(design.id)
    }
    else{
      requestDesignLikes(design.id)
    }
  }
  
  

  const hashtagChips = hashtags.map((tag) => {
    return <Chip
      className={classes.chips}
      avatar={<Avatar>#</Avatar>}
      label={tag}
      clickable
      onClick={() => dispatchPush("/design/hashtag/"+tag)}
    />
  })

  const handleHashtagEdit = () => {
    if(sessionId !== design.user.id){
      enqueueSnackbar("자기 글만 수정합시다",{"variant": "error"});
    }
    else setHashtagEdit(!hashtagEdit)
  }
  const hashtagView = (
    <Box display="flex" flexGrow={1}>
      <Box flexGrow={1}>
        {hashtagChips}
      </Box>
      {sessionId === design.user.id?(
        <React.Fragment>
          <Tooltip title="수정">
            <IconButton onClick={handleHashtagEdit}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton onClick={(event) => setPopoverTarget(event.target)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <ConfirmPopover text="정말 삭제하시겠습니까?" target={popoverTarget} action={() => deleteDesign()} cancel={() => setPopoverTarget(null)} />
        </React.Fragment>
      ):null}
    </Box>
  )
  const hashtagEditForm = (
    <Box display="flex" flexGrow={1}>
      <Box flexGrow={1} component={ChipInput}
      label="태그 수정"
      fullWidth
      defaultValue={hashtags}
      onChange={(chips) => setHashtagFormValue(chips)}
      />
      <Tooltip title="수정 취소">
        <IconButton onClick={() => setHashtagEdit(false)}>
          <Clear />
        </IconButton>
      </Tooltip>
      <Tooltip title="적용">
        <IconButton onClick={() => submitHashtagEdit()} >
          <Done />
        </IconButton>
      </Tooltip>
    </Box>
  )
  const submitHashtagEdit = () => {
    if(sessionId !== design.user.id){
      enqueueSnackbar("자기 글만 수정합시다",{"variant": "error"});
    }
    fetch(yujinserver+"/design/"+design.id, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        "Content-Type": "application/json",
        'Cache': 'no-cache'
      },
      body: JSON.stringify({
          content: hashtagFormValue,
      }),
      credentials: 'include',
    })
    .then(response => response.text(),
        error => console.error(error))
    .then(text => {
        if(text === 'success'){
          enqueueSnackbar("태그를 수정했습니다.",{"variant": "success"});
          setHashtags(hashtagFormValue)
        }
        else enqueueSnackbar("삭제에 실패했습니다. 계속되면 관리자에게 문의해주세요.",{"variant": "error"});
        setHashtagEdit(false)
    })
  }
  const deleteDesign = () => {
    if(sessionId !== design.user.id){
      enqueueSnackbar("자기 글만 삭제합시다",{"variant": "error"});
    }
    fetch(yujinserver+"/design/"+design.id, {
      method: 'DELETE',
      credentials: 'include',
    })
    .then(response => response.text(),
        error => console.error(error))
    .then(text => {
        if(text === 'success'){
          enqueueSnackbar("공유한 코디를 삭제했습니다.",{"variant": "success"});
          reload()
        }
        else enqueueSnackbar("삭제에 실패했습니다. 계속되면 관리자에게 문의해주세요.",{"variant": "error"});
        setHashtagEdit(false)
    })
  }

  return (
    <Box container={Card} width={cardSize} className={classes.card} variant="outlined">
      <Grid container direction="row">
        <Grid item container xs={12} md={8}>
          <Grid item
            // onMouseEnter={handlePopoverOpen}
            // onMouseLeave={handlePopoverClose}
            >
            <NameAvatar name={design.user.name} />
          </Grid>
          <Box>
            <Typography>{design.user.name}</Typography>
            <Typography>{design.updatedAt}</Typography>
          </Box>
        </Grid>
        <Grid item container xs={12} md={4} direction="row" justify="flex-end" alignItems="center">
          <FollowButton targetuserid={design.user.id} />
          <Tooltip placement="top" title={likes?"좋아요 취소":"좋아요"}>
            <IconButton aria-label="like" onClick={handleLikes}>
              {likes?<FavoriteIcon className={classes.likes}/>:<FavoriteBorderIcon />}
            </IconButton>
          </Tooltip>
          <Typography>{design.likecount}</Typography>
        </Grid>
      </Grid>
        
      <CardActionArea>
        {/* <CardMedia
          className={classes.cardMedia}
          image={design.img}
        /> */}
        <Avatar
          src={design.img} 
          variant="rounded"
          className={classes.cardMedia} />
      </CardActionArea>
      <CardActions disableSpacing>
        {hashtagEdit? hashtagEditForm : hashtagView}
        <Tooltip title="사용된 상품">
          <IconButton
            className={clsx(classes.expand, {
              [classes.expandOpen]: expanded,
            })}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          {design.closet !== null?design.closet.products.map((product) => {
            return(
              <Box component={Card} width={1} elevation={0} className={classes.product}>
                <Link component={CardActionArea} to={"/productDetail/"+product.id} style={{width: "25%"}}>
                  <CardMedia
                    className={classes.productMedia}
                    image={product.img}
                  />
                </Link>
                <CardContent style={{flexGrow:1}}>
                  <Typography gutterBottom>{product.pname}</Typography>
                  <Typography gutterBottom variant="body2">{product.price}원</Typography>
                </CardContent>
              </Box>
            )
          }) : null}
        </CardContent>
      </Collapse>
    </Box>
  );
}

DesignCard.propTypes = {
    design: PropTypes.object,
}
  
const mapStateToProps = state => ({
  sessionId: state.auth.currentId,
  designStore: state.design,
  followStore: state.follow,
  //pathname: state.router.location.pathname,
  //search: state.router.location.search,
  //hash: state.router.location.hash,
})

const mapDispatchToProps = (dispatch) => ({
  requestDesignLikes: (designId) => dispatch(requestDesignLikes(designId)),
  requestDesignLikesCancel: (designId) => dispatch(requestDesignLikesCancel(designId)),
  requestFollow: (userId) => dispatch(requestFollow(userId)),
  requestUnfollow: (userId) => dispatch(requestUnfollow(userId)),
  dispatchPush: (url) => dispatch(push(url))
})

export default connect(mapStateToProps, mapDispatchToProps)(withWidth()(DesignCard))
