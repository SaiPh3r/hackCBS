import React, { useEffect } from "react";

const ClassCard = () => {
  const classes = [
    {
      id: 1,
      title: "Front-end Programming",
      teacher: "Ruchi Singhal",
      color: "from-blue-500 to-blue-700",
    },
    {
      id: 2,
      title: "Mathematics for Computing",
      teacher: "Ajay Kumar",
      color: "from-gray-700 to-gray-900",
    },
    {
      id: 3,
      title: "B.Sc. Computer Science",
      teacher: "Guncha Sharma",
      color: "from-purple-600 to-purple-800",
    },
    {
      id: 4,
      title: "12D (2023–24)",
      teacher: "Shipra Narang",
      color: "from-orange-500 to-red-600",
    },
  ];


  const fetchData = async () => {
    try {
        const response = await fetch();
        const result = await response.json()
        console.log(result);

    } catch (error) {
        console.log(error)
    }  
  };

  useEffect(() => {
    fetchData()
  }, []);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {classes.map((cls) => (
        <div
          key={cls.id}
          className={`rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br ${cls.color} relative transition transform hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]`}
        >
          <div className="p-6 flex flex-col justify-between h-40">
            <div>
              <h3 className="text-2xl font-semibold">{cls.title}</h3>
              <p className="text-sm text-gray-200 mt-1">{cls.teacher}</p>
            </div>
            <div className="flex gap-4 mt-4 text-gray-200 text-sm">
              <button className="hover:text-purple-300 transition">
                📁 Folder
              </button>
              <button className="hover:text-purple-300 transition">
                📸 Stream
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClassCard;
