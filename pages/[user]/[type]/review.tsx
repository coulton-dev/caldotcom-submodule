import React from "react";

import AutoSchedulingHeader from "@components/autoscheduling/Header";
import Button from "@components/ui/Button";

export default function Review() {
  return (
    <div className="bg-gray-200 h-screen flex flex-col justify-between">
      <div className="p-4 bg-white">
        <AutoSchedulingHeader />
        <div className="mt-4 overflow-auto">
          <div className="border-y border-y-gray-100">
            <p className="text-gray-500 font-bold text-sm mt-4">Dados do beneficiário</p>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="font-bold pb-2 pt-4">Beneficiário</td>
                  <td className="pb-2 pt-4">José da Silva</td>
                </tr>
                <tr>
                  <td className="font-bold py-2">E-mail</td>
                  <td className="py-2">jose.silva@gmail.com</td>
                </tr>
                <tr>
                  <td className="font-bold py-2">CPF</td>
                  <td className="py-2">123.456.789-00</td>
                </tr>
                <tr>
                  <td className="font-bold py-2">Telefone</td>
                  <td className="py-2">92 99332-2233 </td>
                </tr>
                <tr>
                  <td className="font-bold pt-2 pb-1">Grupo</td>
                  <td className="pt-2 pb-1">012</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-gray-500 font-bold text-sm mt-4">Solicitação</p>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="font-bold pb-2 pt-4">Serviço</td>
                  <td className="pb-2 pt-4">RG 2ª via</td>
                </tr>
                <tr>
                  <td className="font-bold py-2">Local</td>
                  <td className="py-2">PAC Educandos</td>
                </tr>
                <tr>
                  <td className="font-bold py-2">Data</td>
                  <td className="py-2">27/12/2021</td>
                </tr>
                <tr>
                  <td className="font-bold py-2">Horário</td>
                  <td className="py-2">09:20</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="min-h-24 bg-white py-2 px-4 drop-shadow-[0_-4px_8px_rgba(0,0,0,0.08)]">
        <div className="flex flex-row w-full">
          <Button color="secondary" className="w-full justify-center">
            Anterior
          </Button>
          <Button className="w-full ml-4 justify-center">Próximo</Button>
        </div>
      </div>
    </div>
  );
}
