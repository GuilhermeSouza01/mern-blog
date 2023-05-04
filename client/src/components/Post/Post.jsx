import React from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const Post = ({ _id, title, summary, cover, content, createdAt, author }) => {
  return (
    <div className="post">
      <div className="image-content">
        <Link to={`post/${_id}`}>
          <img src={"http://localhost:3001/" + cover} alt="" />
        </Link>
      </div>

      <div className="description-texts">
        <Link to={`post/${_id}`}>
          <h2>{title}</h2>
        </Link>

        <p className="posts-info">
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a className="author">{author.username}</a>
          <time>{format(new Date(createdAt), "MMM d, yyyy HH:mm")}</time>
        </p>
        <p className="post-summary">{summary}</p>
      </div>
    </div>
  );
};

export default Post;
