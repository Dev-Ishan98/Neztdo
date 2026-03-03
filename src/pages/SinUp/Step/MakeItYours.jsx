import { Button, Input, Form, Typography, Select } from "antd";
import { UserOutlined, LockOutlined, GlobalOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { registerUserApi } from "../../../services/authApi";
import { getCountriesApi } from "../../../services/commonApi";
import useNotification from "../../../hooks/useNotification";

const { Title, Text } = Typography;
const { Option } = Select;

const MakeItYours = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notifySuccess, notifyError } = useNotification();
  const [form] = Form.useForm();

  const email = location.state?.email;

  // Fetch countries list
  const { data: countriesData, isLoading: isLoadingCountries } = useQuery({
    queryKey: ["countries"],
    queryFn: getCountriesApi,
  });

  const countries = countriesData?.data?.output || [];

  // Register mutation
  const { mutate, isPending } = useMutation({
    mutationFn: registerUserApi,
    onSuccess: (response) => {
      notifySuccess(response?.data?.message || "Registration successful");
      navigate("/sign-in", { state: { email } });
    },
    onError: (error) => {
      notifyError(error?.response?.data?.message || "Registration failed");
    },
  });

  const handleSubmit = (values) => {
    const selectedCountry = countries.find((c) => c.id === values.country);

    mutate({
      full_name: values.fullName,
      email: email,
      password: values.password,
      confirm_password: values.confirmPassword,
      country_id: selectedCountry?.id,
      country: selectedCountry?.country,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Title level={2} className="!text-slate-100 !mb-2">
          Make it Yours
        </Title>
        <Text className="text-slate-300 block">
          Add your name and create a password so your workspace feels personal.
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        <Form.Item
          label={
            <span className="text-sm font-medium text-slate-200">
              Full Name *
            </span>
          }
          name="fullName"
          rules={[{ required: true, message: "Please enter your full name" }]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Enter your full name"
            size="large"
            className="rounded-lg"
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-sm font-medium text-slate-200">
              Your Country *
            </span>
          }
          name="country"
          rules={[{ required: true, message: "Please select your country" }]}
        >
          <Select
            placeholder="Click to see countries"
            size="large"
            className="rounded-lg"
            suffixIcon={<GlobalOutlined className="text-gray-400" />}
            loading={isLoadingCountries}
          >
            {countries.map((country) => (
              <Option key={country.id} value={country.id}>
                {country.country}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={
            <span className="text-sm font-medium text-slate-200">
              Password *
            </span>
          }
          name="password"
          rules={[
            { required: true, message: "Please enter password" },
            { min: 8, message: "Password must be at least 8 characters" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Enter password"
            size="large"
            className="rounded-lg"
          />
        </Form.Item>

        <Form.Item
          label={
            <span className="text-sm font-medium text-slate-200">
              Confirm Password *
            </span>
          }
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Re-enter password"
            size="large"
            className="rounded-lg"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isPending}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg h-11 font-medium border-none"
          >
            Continue
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default MakeItYours;
