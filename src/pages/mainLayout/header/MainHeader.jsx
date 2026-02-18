import { useSelector } from "react-redux";
import T from "../../../components/baseComponents/text/T";
import HeaderImage from "../../../components/commonComponent/HeaderImage";

export default function MainHeader() {
  const name = useSelector((state) => state.auth.data.username);

  return (
    <div className="flex flex-row items-center justify-end  p-2 border-b ">
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center justify-end gap-2 ssm:max-w-[180px] sm:max-w-[300px] h-full">
          <div className="w-[50px] h-[50px] min-w-[50px] rounded-full overflow-hidden">
            <HeaderImage
              url={null}
              // url={user?.imageURL}
              name={name}
              textSize={6}
            />
          </div>
          <T variant="h6" className="font-normal text-colorPrimary">
            {name}
          </T>
        </div>
      </div>
    </div>
  );
}
