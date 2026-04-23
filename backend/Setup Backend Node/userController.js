exports.register = (req, res) => {
  const { name, email, password } = req.body;

  res.json({
    message: "User registered successfully ✅",
    user: {
      name,
      email
    }
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  res.json({
    message: "Login successful ✅",
    token: "fake-jwt-token"
  });
};